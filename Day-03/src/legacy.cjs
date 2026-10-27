/**
 * Legacy CommonJS module demonstrating CJS / ESM interoperability in Node.js.
 * Uses module.exports and standard CommonJS conventions.
 */

function getSystemBanner() {
  const os = require('node:os');
  return {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    moduleType: 'CommonJS (.cjs)',
    loadedAt: new Date().toISOString(),
  };
}

function formatBannerText(banner) {
  return `[Environment: Node ${banner.nodeVersion} on ${banner.platform}-${banner.arch} | Runtime Loader: ${banner.moduleType}]`;
}

module.exports = {
  getSystemBanner,
  formatBannerText,
};
