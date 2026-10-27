import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { summarise, groupByLanguage, sortRepos } from '../src/report.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fixturePath = resolve(__dirname, '../test/fixtures/repos.json');
const distDir = resolve(__dirname, '../dist');
const outputPath = resolve(distDir, 'report.json');

console.log('🚀 Running offline build for repo-report...');

const rawData = readFileSync(fixturePath, 'utf-8');
const repos = JSON.parse(rawData);

// Filter out forks & archived just like the live client
const activeRepos = repos.filter((r) => !r.fork && !r.archived);
const summary = summarise(activeRepos);
const grouped = groupByLanguage(activeRepos);

const report = {
  buildTimestamp: new Date().toISOString(),
  environment: 'production-build-offline',
  summary,
  groupedByLanguage: grouped,
  sortedRepositories: sortRepos(activeRepos),
};

mkdirSync(distDir, { recursive: true });
writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');

console.log('✅ Build completed successfully!');
console.log('📦 Output written to: dist/report.json');
