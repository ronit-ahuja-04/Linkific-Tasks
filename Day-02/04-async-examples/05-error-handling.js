/**
 * 05-error-handling.js
 * Demonstrates robust asynchronous HTTP error handling:
 * 1. Handling HTTP 404 Not Found via response.ok check (fetch does NOT reject on 404!)
 * 2. Handling genuine network disconnect / DNS failures
 * 3. Structured try / catch / finally cleanup patterns
 */

// CONCEPT: error-handling

console.log('====================================================');
console.log('       05: ASYNCHRONOUS HTTP ERROR HANDLING         ');
console.log('====================================================\n');

/**
 * Demonstrates HTTP 404 response handling.
 * Gotcha: fetch() resolves normally on HTTP 404 and 500! It only rejects on network failures.
 * You MUST check response.ok.
 */
async function testHttp404Handling() {
  const badUrl = 'https://pokeapi.co/api/v2/pokemon/this-pokemon-does-not-exist';
  console.log(`[1] Requesting invalid endpoint (expecting 404): ${badUrl}`);

  try {
    const response = await fetch(badUrl);

    console.log(`[Status] HTTP Status Code: ${response.status}`);
    console.log(`[response.ok] Evaluates to: ${response.ok}`);

    if (!response.ok) {
      // Explicit error thrown when status is not 200-299
      throw new Error(`Resource not found (HTTP ${response.status})`);
    }

    const data = await response.json();
    console.log('Data:', data);
  } catch (error) {
    console.log(`[Handled 404 Error]: ${error.message} (Successfully intercepted via response.ok check)`);
  } finally {
    console.log('[Finally] 404 verification cleanup completed.\n');
  }
}

/**
 * Demonstrates genuine network / DNS failure handling.
 */
async function testNetworkFailureHandling() {
  const nonExistentHost = 'https://domain-that-absolutely-does-not-exist-12345.xyz';
  console.log(`[2] Requesting invalid domain (expecting network failure): ${nonExistentHost}`);

  try {
    // This will genuinely reject because DNS resolution fails
    await fetch(nonExistentHost);
  } catch (error) {
    console.log(`[Handled Network Failure]: Caught low-level fetch rejection: ${error.message}`);
  } finally {
    console.log('[Finally] Network failure cleanup completed.\n');
  }
}

async function runErrorHandlingDemos() {
  await testHttp404Handling();
  await testNetworkFailureHandling();
  console.log('All error handling demonstrations completed successfully.');
}

runErrorHandlingDemos();
