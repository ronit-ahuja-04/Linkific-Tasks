/**
 * Standalone Demonstration: Axios HTTP Client
 * Run with: node examples/axios-demo.js
 */
import axios from 'axios';

async function runDemo() {
  console.log('--- 🌐 Axios Demonstration ---');
  try {
    const response = await axios.get('https://api.github.com/rate_limit', {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'repo-report-demo',
      },
      timeout: 5000,
    });

    const rate = response.data.resources.core;
    console.log(`HTTP Status Code: ${response.status} OK`);
    console.log(`Rate Limit:       ${rate.remaining} / ${rate.limit} requests remaining`);
    console.log(`Reset Timestamp:  ${new Date(rate.reset * 1000).toLocaleTimeString()}`);
    console.log('\n✅ Axios successfully performed GET request with custom headers.');
  } catch (err) {
    console.error(`Axios request error: ${err.message}`);
  }
}

runDemo();
