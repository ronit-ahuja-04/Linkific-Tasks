// Turns the JSON of one measurement run into docs/perf/<label>.md (and, given two labels, a comparison).
//   node scripts/perf/report.mjs before            -> docs/perf/before.md
//   node scripts/perf/report.mjs before after      -> docs/perf/comparison.md
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { DOCS } from './common.mjs';

const load = (name) => {
  const file = path.join(DOCS, name);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
};
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const ms = (value) => `${Math.round(value).toLocaleString('en-US')} ms`;

function sections(label) {
  const bundle = load(`bundle-${label}.json`);
  const lighthouse = load(`lighthouse-${label}.json`);
  const inter = load(`interactions-${label}.json`);
  const out = [];
  if (bundle) {
    out.push(
      '## Bundle',
      '',
      `Treemap: [bundle-${label}.html](bundle-${label}.html). Sizes are what the browser downloads (gzip; brotli is ~15% smaller).`,
      '',
      '| | Chunks | Raw | gzip |',
      '|---|---|---|---|',
      `| **Initial JavaScript** (needed before the first render) | ${bundle.initial.chunks} | ${kb(bundle.initial.raw)} | **${kb(bundle.initial.gzip)}** |`,
      `| Lazy JavaScript (loaded when needed) | ${bundle.lazy.chunks} | ${kb(bundle.lazy.raw)} | ${kb(bundle.lazy.gzip)} |`,
      `| Initial CSS | ${bundle.initialCss.files} | ${kb(bundle.initialCss.raw)} | ${kb(bundle.initialCss.gzip)} |`,
      `| Font files in the build | ${bundle.fonts.files} | ${kb(bundle.fonts.raw)} | |`,
      '',
      ...(bundle.byPackage ? [
        'What the initial JavaScript is made of (gzip size of each part inside the bundle):',
        '',
        '| Package or app folder | Raw | gzip |',
        '|---|---|---|',
        ...bundle.byPackage.map((p) => `| ${p.name} | ${kb(p.raw)} | ${kb(p.gzip)} |`),
        '',
      ] : []),
      'Largest chunks:',
      '',
      '| Chunk | gzip | Loaded |',
      '|---|---|---|',
      ...bundle.chunks.slice(0, 8).map((c) => `| ${c.name} | ${kb(c.gzip)} | ${c.initial ? 'first visit' : 'later'} |`),
      '',
    );
  }
  if (lighthouse) {
    out.push(
      '## Lighthouse',
      '',
      'Production build, served with compression like a static host. Median of the runs (all scores shown). Mobile = Lighthouse default (mid-range phone, slow 4G, 4x CPU, simulated).',
      '',
      '| Page | Device | Performance | Runs | LCP | TBT | CLS | Accessibility | Best practices | Transfer (JS / images / fonts) |',
      '|---|---|---|---|---|---|---|---|---|---|',
      ...lighthouse.map((r) => `| ${r.page} | ${r.formFactor} | **${r.performance}** | ${r.scores.join(', ')} | ${ms(r.lcp)} | ${ms(r.tbt)} | ${r.cls.toFixed(3)} | ${r.accessibility} | ${r.bestPractices} | ${r.totalKb} KB (${r.scriptKb} / ${r.imageKb} / ${r.fontKb}) |`),
      '',
      'Top opportunities Lighthouse reported (mobile):',
      '',
      ...lighthouse.filter((r) => r.formFactor === 'mobile' && r.opportunities.length > 0).map((r) => `- **${r.page}:** ${r.opportunities.map((o) => `${o.title} (${o.ms ? `${o.ms} ms` : ''}${o.ms && o.kb ? ', ' : ''}${o.kb ? `${o.kb} KB` : ''})`).join('; ')}`),
      '',
    );
  }
  if (inter) {
    const r = inter.renders;
    const top = (scenario, n = 6) => Object.entries(scenario.byComponent).slice(0, n).map(([name, count]) => `${name} ${count}`).join(', ');
    const t = inter.timings;
    out.push(
      '## While the app is used',
      '',
      `Renders counted with React's DevTools hook on the dev server; timings on the production build with the CPU slowed 4x. The chat scenario is a long session: the Perf lab room with **${r.typing.onScreen} messages** on screen.`,
      '',
      '| Scenario | Commits | Component renders | Most rendered |',
      '|---|---|---|---|',
      `| Type 32 characters in the chat composer | ${r.typing.commits} | ${r.typing.total.toLocaleString('en-US')} | ${top(r.typing)} |`,
      `| Receive 5 messages (Realtime) | ${r.receiving.commits} | **${r.receiving.total.toLocaleString('en-US')}** | ${top(r.receiving)} |`,
      `| Type 10 characters in notes search | ${r.notesSearchTyping.commits} | ${r.notesSearchTyping.total.toLocaleString('en-US')} | ${top(r.notesSearchTyping)} |`,
      '',
      '| Timing (production build, CPU 4x slower) | Value |',
      '|---|---|',
      `| Open the Perf lab room (first messages visible) | ${ms(t.openRoomMs)} |`,
      `| Page size with ${t.onScreen} messages | ${t.domNodes.toLocaleString('en-US')} DOM elements |`,
      `| Typing: key press to next paint, median / worst (${t.typing.interactions} interactions) | ${ms(t.typing.medianMs)} / ${ms(t.typing.worstMs)} |`,
      `| Typing: main thread blocked (long tasks) | ${ms(t.typing.longTaskMs)} |`,
      `| Receiving 5 messages: main thread blocked (long tasks) | **${ms(t.receivingLongTaskMs)}** |`,
      ...(t.notesTyping ? [`| Notes search: key press to next paint, median / worst (${t.notesTyping.interactions} interactions) | ${ms(t.notesTyping.medianMs)} / ${ms(t.notesTyping.worstMs)} |`] : []),
      '',
      '| Page | Image requests | Image bytes | Biggest image | Downloaded vs shown width (worst) | CLS |',
      '|---|---|---|---|---|---|',
      ...Object.entries(t.pages).map(([name, p]) => `| ${name} | ${p.imageRequests} | **${p.imageKb.toLocaleString('en-US')} KB** | ${p.biggestImageKb.toLocaleString('en-US')} KB | ${p.worstOversize ?? '–'}× | ${p.cls} |`),
      '',
    );
  }
  return out;
}

export function writeReport(label, other) {
  const lines = other
    ? [`# Performance: ${label} vs ${other}`, '', ...[label, other].flatMap((l) => [`# ${l}`, '', ...sections(l)])]
    : [`# Performance measurements: ${label}`, '', `Generated by \`npm run perf\` (label \`${label}\`) on ${new Date().toISOString().slice(0, 10)}. Data: the local test data set (\`scripts/perf-data.mjs\`), signed in as the perf test user.`, '', ...sections(label)];
  const file = path.join(DOCS, other ? 'comparison.md' : `${label}.md`);
  writeFileSync(file, lines.join('\n'));
  return file;
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(writeReport(process.argv[2] ?? 'before', process.argv[3]));
