// Run a small JavaScript snippet the AI wrote and capture what it prints, so "what does this print?" answers are
// checked by actually running the code, not by trusting the model.
//
// Two layers: a separate Node process with the permission model on (no file writes, no child processes, no
// workers) and a hard timeout; inside it, the snippet runs in an empty vm context: only console.log exists (no
// require, process, fetch or timers). Output is capped.
import { spawn } from 'node:child_process';

const HARNESS = `
const vm = require('node:vm');
let code = '';
process.stdin.on('data', (d) => { code += d; });
process.stdin.on('end', () => {
  const out = [];
  const log = (...args) => { if (out.length < 200) out.push(args.map((a) => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')); };
  try {
    vm.runInNewContext(code, Object.freeze({ console: Object.freeze({ log, info: log, warn: log, error: log }) }), { timeout: 1000 });
    process.stdout.write(JSON.stringify({ ok: true, output: out.join('\\n') }));
  } catch (e) {
    process.stdout.write(JSON.stringify({ ok: false, output: out.join('\\n'), error: String(e && e.message || e) }));
  }
});`;

/** @returns {Promise<{ ok: boolean, output: string, error?: string }>} */
export function runJs(code, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ['--experimental-permission', '--no-warnings', '-e', HARNESS],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {}, // nothing from the worker's environment (no keys) reaches the snippet
      },
    );
    let stdout = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.stdout.on('data', (d) => {
      if (stdout.length < 20000) stdout += d;
    });
    child.on('close', () => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(stdout));
      } catch {
        resolve({ ok: false, output: '', error: 'The code did not finish (timeout or crash).' });
      }
    });
    child.stdin.end(code);
  });
}

/** Compare printed output loosely: trim each line, collapse spaces, ignore blank lines. */
export function sameOutput(a, b) {
  const norm = (s) =>
    String(s ?? '')
      .split(/\r?\n/)
      .map((l) => l.trim().replace(/\s+/g, ' '))
      .filter(Boolean)
      .join('\n');
  return norm(a) === norm(b);
}

/**
 * Check each question that shows code and states what it prints. A question is kept if the code really prints
 * expected_output and the marked-correct option says the same; otherwise it's dropped (with the reason).
 */
export async function verifyQuestions(questions, { language = 'javascript' } = {}) {
  const kept = [];
  const dropped = [];
  for (const q of questions) {
    if (!q.code || !q.expected_output) {
      kept.push({ ...q, machine_checked: false });
      continue;
    }
    if (language !== 'javascript') {
      kept.push({ ...q, machine_checked: false });
      continue;
    }
    const run = await runJs(q.code);
    if (!run.ok) {
      dropped.push({ prompt: q.prompt, reason: `the code fails to run (${run.error})` });
      continue;
    }
    if (!sameOutput(run.output, q.expected_output)) {
      dropped.push({
        prompt: q.prompt,
        reason: `the code prints "${run.output}", not "${q.expected_output}"`,
      });
      continue;
    }
    const marked = q.options[q.correct_index];
    const printsLike = (s) =>
      sameOutput(s, run.output) || sameOutput(String(s).replace(/,\s*/g, '\n'), run.output);
    if (q.asks_for_output && !printsLike(marked)) {
      const fixed = q.options.findIndex(printsLike);
      if (fixed === -1) {
        dropped.push({
          prompt: q.prompt,
          reason: `no option matches the real output "${run.output}"`,
        });
        continue;
      }
      kept.push({ ...q, correct_index: fixed, machine_checked: true, corrected: true });
      continue;
    }
    kept.push({ ...q, machine_checked: true });
  }
  return { kept, dropped };
}
