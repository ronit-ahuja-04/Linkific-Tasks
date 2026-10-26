/**
 * 01-callbacks.js
 * Demonstrates asynchronous callback patterns, setTimeout, nested callback chains
 * ("Callback Hell" / Pyramid of Doom), and a clean modular callback refactor.
 */

// CONCEPT: callbacks

console.log('====================================================');
console.log('         01: ASYNCHRONOUS CALLBACK PATTERNS         ');
console.log('====================================================\n');

// 1. Simple Asynchronous Timer Callback
console.log('[Step 1] Synchronous start');

setTimeout(() => {
  console.log('[Step 3] setTimeout callback executed after 100ms delay');
}, 100);

console.log('[Step 2] Synchronous end (runs before timer callback!)');


// 2. Simulated Async Operations with Nested Callbacks ("Callback Hell")
function fetchUser(userId, callback) {
  setTimeout(() => {
    console.log(`\n[DB] Fetched user record for ID: ${userId}`);
    callback(null, { id: userId, username: 'ronit_dev' });
  }, 150);
}

function fetchUserOrders(username, callback) {
  setTimeout(() => {
    console.log(`[DB] Fetched orders for user: ${username}`);
    callback(null, [{ orderId: 'ord-101', total: 1299 }, { orderId: 'ord-102', total: 450 }]);
  }, 150);
}

function processPayment(orderId, callback) {
  setTimeout(() => {
    console.log(`[Payment] Processed payment for order: ${orderId}`);
    callback(null, { orderId, status: 'PAID', transactionId: 'txn_9921' });
  }, 150);
}

// Running the nested callback pyramid
setTimeout(() => {
  console.log('\n--- 2. Nested Callback Pyramid ("Callback Hell") ---');

  fetchUser(42, (err1, user) => {
    if (err1) return console.error('Failed to get user:', err1);

    fetchUserOrders(user.username, (err2, orders) => {
      if (err2) return console.error('Failed to get orders:', err2);

      processPayment(orders[0].orderId, (err3, receipt) => {
        if (err3) return console.error('Failed to process payment:', err3);

        console.log('Pyramid completed! Final receipt:', receipt);

        // 3. Modular Callback Refactor
        runModularRefactor();
      });
    });
  });
}, 300);

// 3. Modular Refactor: Flattening nested callbacks with named handler functions
function runModularRefactor() {
  console.log('\n--- 3. Modular Callback Refactor (Flattened) ---');

  function handlePaymentResult(err, receipt) {
    if (err) return console.error('Modular payment error:', err);
    console.log('[Modular] Final payment receipt:', receipt);
    console.log('\nAll callback demonstrations finished successfully.');
  }

  function handleOrdersResult(err, orders) {
    if (err) return console.error('Modular orders error:', err);
    processPayment(orders[0].orderId, handlePaymentResult);
  }

  function handleUserResult(err, user) {
    if (err) return console.error('Modular user error:', err);
    fetchUserOrders(user.username, handleOrdersResult);
  }

  fetchUser(100, handleUserResult);
}
