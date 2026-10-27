import lodash from 'lodash';
const { groupBy, orderBy, sumBy } = lodash;

/**
 * Groups repositories by primary language.
 * Unspecified or null languages are grouped under "Unknown".
 *
 * @param {Array<object>} repos - List of repository objects
 * @returns {Record<string, Array<object>>} Grouped repositories by language
 */
export function groupByLanguage(repos = []) {
  if (!Array.isArray(repos)) return {};
  return groupBy(repos, (repo) => repo.language || 'Unknown');
}

/**
 * Sorts repositories by star count descending, then by last push date descending.
 *
 * @param {Array<object>} repos - List of repository objects
 * @returns {Array<object>} Sorted repositories
 */
export function sortRepos(repos = []) {
  if (!Array.isArray(repos)) return [];
  return orderBy(
    repos,
    ['stargazers_count', 'pushed_at'],
    ['desc', 'desc']
  );
}

/**
 * Calculates summary metrics (totals) for a collection of repositories.
 *
 * @param {Array<object>} repos - List of repository objects
 * @returns {{ totalRepos: number, totalStars: number, totalForks: number }} Summary object
 */
export function summarise(repos = []) {
  if (!Array.isArray(repos)) {
    return { totalRepos: 0, totalStars: 0, totalForks: 0 };
  }
  return {
    totalRepos: repos.length,
    totalStars: sumBy(repos, 'stargazers_count') || 0,
    totalForks: sumBy(repos, 'forks_count') || 0,
  };
}

/**
 * Formats a single repository line for terminal output.
 *
 * @param {object} repo
 * @returns {string} Formatted line
 */
export function formatRepoLine(repo) {
  const stars = `★ ${repo.stargazers_count || 0}`.padEnd(8);
  const forks = `⑂ ${repo.forks_count || 0}`.padEnd(8);
  const pushed = repo.pushed_at ? repo.pushed_at.slice(0, 10) : 'unknown';
  return `  • ${repo.name.padEnd(30)} ${stars} ${forks} (Last pushed: ${pushed})`;
}

/**
 * Generates the complete terminal report string for a user and their repos.
 *
 * @param {string} username - GitHub handle
 * @param {Array<object>} repos - Repository list
 * @returns {string} Formatted multi-line report
 */
export function generateReport(username, repos = []) {
  const summary = summarise(repos);
  const grouped = groupByLanguage(repos);

  // Sort language sections by repo count descending
  const sortedLanguages = orderBy(
    Object.keys(grouped),
    [(lang) => grouped[lang].length],
    ['desc']
  );

  let output = `\n======================================================\n`;
  output += `  📊 GITHUB REPOSITORY REPORT: ${username}\n`;
  output += `======================================================\n`;
  output += `  Total Repositories: ${summary.totalRepos}\n`;
  output += `  Total Stars:        ${summary.totalStars} ★\n`;
  output += `  Total Forks:        ${summary.totalForks} ⑂\n`;
  output += `------------------------------------------------------\n\n`;

  if (summary.totalRepos === 0) {
    output += `  No public repositories found.\n`;
    return output;
  }

  for (const lang of sortedLanguages) {
    const langRepos = sortRepos(grouped[lang]);
    output += `📁 ${lang} (${langRepos.length} ${langRepos.length === 1 ? 'repo' : 'repos'}):\n`;
    for (const repo of langRepos) {
      output += formatRepoLine(repo) + '\n';
    }
    output += '\n';
  }

  output += `======================================================\n`;
  return output;
}
