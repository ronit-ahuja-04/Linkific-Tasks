// Node run of the same Lodash-vs-native suites the Benchmark tab uses. Prints a markdown table.
// Usage: node scripts/benchmark.mjs [size ...]   (default 10000 50000)
import { performance } from 'node:perf_hooks';
import { createServer } from 'vite';

// Vite loads the source modules, so the same files the app uses run here (extensionless lodash/x imports included)
const vite = await createServer({ configFile: false, logLevel: 'silent', server: { middlewareMode: true }, appType: 'custom' });
const { SUITES, runSuite, suitesFor } = await vite.ssrLoadModule('/src/lib/benchmarks.js');
const { generateUsers } = await vite.ssrLoadModule('/src/data/generateUsers.js');

const sizes = process.argv.slice(2).map(Number).filter(Boolean);
for (const size of sizes.length ? sizes : [10000, 50000]) {
  const users = generateUsers(size);
  console.log(`\n### ${size.toLocaleString()} users (median of 11 runs, 3 warm-up)\n`);
  console.log('| Suite | Lodash (ms) | Native (ms) | Faster |');
  console.log('|---|---:|---:|---|');
  for (const suite of suitesFor(size)) {
    const r = runSuite(suite, users, { iterations: 11, warmup: 3, now: () => performance.now() });
    const faster = r.winner === 'tie' ? 'tie' : `${r.winner} ${r.factor.toFixed(1)}x`;
    console.log(`| ${r.title} | ${r.lodashMs.toFixed(2)} | ${r.nativeMs.toFixed(2)} | ${faster} |`);
  }
}
console.log(`\nNode ${process.version}, ${SUITES.length} suites`);
await vite.close();
