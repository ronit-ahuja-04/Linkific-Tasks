/**
 * 03-async-await.js
 * Demonstrates async/await syntax: synchronous-looking asynchronous code,
 * robust try/catch/finally error handling, and sequential vs parallel execution timing.
 */

// CONCEPT: async-await
// CONCEPT: error-handling

console.log('====================================================');
console.log('             03: ASYNC / AWAIT DEMONSTRATION        ');
console.log('====================================================\n');

/**
 * Simulates a delay returning a promise.
 * @param {string} taskName
 * @param {number} delayMs
 * @param {boolean} shouldFail
 * @returns {Promise<string>}
 */
function simulateAsyncTask(taskName, delayMs, shouldFail = false) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error(`Failure during task: ${taskName}`));
      } else {
        resolve(`Result of ${taskName}`);
      }
    }, delayMs);
  });
}

// 1. Basic async/await with try / catch / finally
async function runBasicAsyncFlow() {
  console.log('--- 1. Basic async / await & try/catch/finally ---');
  try {
    console.log('[awaiting] Starting asynchronous call...');
    const result = await simulateAsyncTask('fetch_user_token', 100);
    console.log('[resolved]', result);
  } catch (err) {
    console.error('[caught]', err.message);
  } finally {
    console.log('[finally] Cleanup complete (always runs)\n');
  }
}

// 2. Sequential Execution (await in series)
async function runSequentialFlow() {
  console.log('--- 2. Sequential Execution (Awaited in series) ---');
  const start = Date.now();

  console.log('Starting Step 1 (100ms)...');
  const step1 = await simulateAsyncTask('Step 1', 100);

  console.log('Starting Step 2 (100ms)...');
  const step2 = await simulateAsyncTask('Step 2', 100);

  console.log('Starting Step 3 (100ms)...');
  const step3 = await simulateAsyncTask('Step 3', 100);

  const totalTime = Date.now() - start;
  console.log(`Sequential execution took ~${totalTime}ms (100 + 100 + 100):`, [step1, step2, step3]);
}

// 3. Parallel Execution (await Promise.all)
async function runParallelFlow() {
  console.log('\n--- 3. Parallel Execution with Promise.all ---');
  const start = Date.now();

  console.log('Launching Step A, Step B, and Step C concurrently...');
  // Launch all 3 promises simultaneously before awaiting
  const pA = simulateAsyncTask('Step A', 100);
  const pB = simulateAsyncTask('Step B', 100);
  const pC = simulateAsyncTask('Step C', 100);

  const [resA, resB, resC] = await Promise.all([pA, pB, pC]);

  const totalTime = Date.now() - start;
  console.log(`Parallel execution took ~${totalTime}ms (concurrently max ~100ms):`, [resA, resB, resC]);
}

// 4. Error Handling in async/await
async function runErrorHandlingFlow() {
  console.log('\n--- 4. Error Handling with try/catch ---');
  try {
    console.log('Attempting risky operation...');
    await simulateAsyncTask('risky_operation', 80, true);
  } catch (error) {
    console.log('[try/catch] Caught expected exception:', error.message);
  } finally {
    console.log('[try/catch] Finalized error flow safely.\n');
  }
}

// Orchestrator
async function main() {
  await runBasicAsyncFlow();
  await runSequentialFlow();
  await runParallelFlow();
  await runErrorHandlingFlow();
  console.log('All async/await demonstrations completed successfully.');
}

main();
