/**
 * 02-promises.js
 * Demonstrates native Promises: constructor, state transitions (pending, fulfilled, rejected),
 * .then/.catch/.finally handler chains, and parallel execution with Promise.all.
 */

// CONCEPT: promises

console.log('====================================================');
console.log('             02: ES6 PROMISES DEMONSTRATION         ');
console.log('====================================================\n');

/**
 * Simulates an asynchronous database query returning a Promise.
 * @param {string} entity
 * @param {number} delayMs
 * @param {boolean} shouldFail
 * @returns {Promise<object>}
 */
function queryDatabase(entity, delayMs = 100, shouldFail = false) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error(`Database timeout while fetching ${entity}`));
      } else {
        resolve({ entity, timestamp: Date.now(), status: 'SUCCESS' });
      }
    }, delayMs);
  });
}

// 1. Basic Promise: .then(), .catch(), and .finally()
console.log('[1] Initiating single promise query...');
queryDatabase('user_profile', 80)
  .then((result) => {
    console.log('[1] .then() handled fulfillment:', result.entity);
    return result;
  })
  .catch((err) => {
    console.error('[1] .catch() handled rejection:', err.message);
  })
  .finally(() => {
    console.log('[1] .finally() executed (cleanup runs regardless of success or failure)');
    runPromiseChainingDemo();
  });


// 2. Promise Chaining
function runPromiseChainingDemo() {
  console.log('\n--- 2. Promise Chaining ---');

  queryDatabase('order_header', 50)
    .then((order) => {
      console.log('[Chain 1] Loaded order header');
      // Returning another promise chains seamlessly
      return queryDatabase(`order_items_for_${order.entity}`, 50);
    })
    .then((items) => {
      console.log('[Chain 2] Loaded order items');
      // Transforming value
      return `Processed receipt with status: ${items.status}`;
    })
    .then((receiptSummary) => {
      console.log('[Chain 3] Final summary:', receiptSummary);
      runPromiseAllDemo();
    })
    .catch((err) => {
      console.error('[Chain Error]:', err.message);
    });
}


// 3. Parallel Execution with Promise.all
// CONCEPT: Promise.all
function runPromiseAllDemo() {
  console.log('\n--- 3. Parallel Execution with Promise.all ---');

  const startTime = Date.now();

  const promise1 = queryDatabase('service_auth', 100);
  const promise2 = queryDatabase('service_catalog', 100);
  const promise3 = queryDatabase('service_pricing', 100);

  // All 3 run concurrently in parallel rather than sequentially (takes ~100ms instead of 300ms)
  Promise.all([promise1, promise2, promise3])
    .then(([auth, catalog, pricing]) => {
      const elapsed = Date.now() - startTime;
      console.log(`[Promise.all] All 3 services resolved in parallel in ~${elapsed}ms`);
      console.log('Results:', [auth.entity, catalog.entity, pricing.entity]);

      runPromiseAllFailureDemo();
    })
    .catch((err) => {
      console.error('[Promise.all] Unexpected rejection:', err.message);
    });
}

// 4. Promise.all Fail-Fast Behavior
function runPromiseAllFailureDemo() {
  console.log('\n--- 4. Promise.all Fail-Fast Demonstration ---');

  const pSuccess1 = queryDatabase('service_healthy_1', 60);
  const pFailed = queryDatabase('service_broken', 40, true); // fails deliberately
  const pSuccess2 = queryDatabase('service_healthy_2', 120);

  Promise.all([pSuccess1, pFailed, pSuccess2])
    .then(() => {
      console.log('Will not execute due to rejection');
    })
    .catch((err) => {
      console.log('[Promise.all Fail-Fast] Caught first rejection immediately:', err.message);
      console.log('\nAll Promise demonstrations completed successfully.');
    });
}
