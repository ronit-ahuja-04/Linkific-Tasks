#!/usr/bin/env node
import { fetchRepos } from './github.js';
import { formatApiError } from './errors.js';
import { generateReport } from './report.js';

/**
 * Parses CLI arguments without external dependencies.
 * Usage: node src/index.js <username> [--all]
 *
 * @param {string[]} argv
 * @returns {{ username: string|null, includeAll: boolean }}
 */
export function parseArgs(argv = process.argv.slice(2)) {
  const flags = new Set();
  const positional = [];

  for (const arg of argv) {
    if (arg.startsWith('--')) {
      flags.add(arg);
    } else {
      positional.push(arg);
    }
  }

  return {
    username: positional[0] || null,
    includeAll: flags.has('--all'),
  };
}

async function main() {
  const { username, includeAll } = parseArgs();

  if (!username) {
    console.error('Usage: npm start -- <username> [--all]');
    console.error('Example: npm start -- ronit-ahuja-04');
    process.exit(1);
  }

  try {
    const repos = await fetchRepos(username, undefined, includeAll);
    console.log(generateReport(username, repos));
  } catch (error) {
    console.error(formatApiError(error, username));
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  main();
}
