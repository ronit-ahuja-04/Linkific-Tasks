/**
 * Standalone Demonstration: Lodash Utilities
 * Run with: node examples/lodash-demo.js
 */
import lodash from 'lodash';
const { groupBy, orderBy, sumBy, countBy, chunk } = lodash;

console.log('--- 🛠️ Lodash Utilities Demonstration ---');

const sampleRepos = [
  { name: 'web-app', language: 'JavaScript', stars: 120 },
  { name: 'api-service', language: 'TypeScript', stars: 350 },
  { name: 'data-pipeline', language: 'Python', stars: 210 },
  { name: 'cli-tool', language: 'JavaScript', stars: 45 },
  { name: 'mobile-app', language: 'TypeScript', stars: 190 },
];

console.log('\n1. Grouped by Language (lodash.groupBy):');
console.log(groupBy(sampleRepos, 'language'));

console.log('\n2. Sorted by Stars Descending (lodash.orderBy):');
console.log(orderBy(sampleRepos, ['stars'], ['desc']));

console.log('\n3. Total Stars (lodash.sumBy):');
console.log(sumBy(sampleRepos, 'stars'));

console.log('\n4. Language Count Distribution (lodash.countBy):');
console.log(countBy(sampleRepos, 'language'));

console.log('\n5. Chunked into batches of 2 (lodash.chunk):');
console.log(chunk(sampleRepos, 2));

console.log('\n✅ All lodash utility operations completed successfully.');
