/**
 * 02-operators-conditionals-loops.js
 * Demonstrates JavaScript operators (arithmetic, comparison, logical, nullish),
 * conditional branching (if/else, switch, ternary), and all loop types
 * with guidance on when to choose each.
 */

// ============================================================================
// 1. Operators: Arithmetic, Comparison, Logical, Nullish Coalescing
// ============================================================================
// CONCEPT: operators

console.log('--- 1. Operators ---');

// Arithmetic
const a = 10;
const b = 3;
console.log('Addition (10 + 3):       ', a + b);  // 13
console.log('Subtraction (10 - 3):    ', a - b);  // 7
console.log('Multiplication (10 * 3): ', a * b);  // 30
console.log('Division (10 / 3):       ', (a / b).toFixed(2)); // "3.33"
console.log('Remainder / Modulo (10 % 3):', a % b); // 1
console.log('Exponentiation (10 ** 3):', a ** b); // 1000

// Comparison
console.log('Strict equal (10 === 10):    ', a === 10); // true
console.log('Strict not equal (10 !== 3): ', a !== b);  // true
console.log('Less than (3 < 10):          ', b < a);   // true
console.log('Greater than or equal:       ', a >= 10);  // true

// Logical Operators
const isLoggedIn = true;
const hasAdminRole = false;
console.log('AND (&&):', isLoggedIn && hasAdminRole); // false
console.log('OR (||): ', isLoggedIn || hasAdminRole); // true
console.log('NOT (!): ', !isLoggedIn);                // false

// Nullish Coalescing (??) vs Logical OR (||)
// ?? checks ONLY for null or undefined; || checks for any falsy value (0, '', false, null, undefined)
const userScore = 0;
const fallbackScore = userScore || 50; // 0 is falsy, so it incorrectly defaults to 50
const correctScore = userScore ?? 50;  // 0 is not nullish, so it preserves 0
console.log('Score using ||:', fallbackScore); // 50 (bug!)
console.log('Score using ??:', correctScore);  // 0  (correct!)


// ============================================================================
// 2. Conditionals: if / else if / else
// ============================================================================
// CONCEPT: if-else

console.log('\n--- 2. if / else if / else ---');

function evaluateScore(score) {
  if (score >= 90) {
    return 'Grade: A+ (Outstanding)';
  } else if (score >= 75) {
    return 'Grade: A (Very Good)';
  } else if (score >= 50) {
    return 'Grade: B (Pass)';
  } else {
    return 'Grade: F (Needs Retest)';
  }
}
console.log('Score 82:', evaluateScore(82));
console.log('Score 45:', evaluateScore(45));


// ============================================================================
// 3. switch Statement
// ============================================================================
// CONCEPT: switch

console.log('\n--- 3. switch Statement ---');

function getNotificationMessage(status) {
  switch (status) {
    case 'pending':
      return 'Your request is in queue.';
    case 'in_progress':
      return 'Processing in progress...';
    case 'completed':
      return 'Task completed successfully!';
    case 'failed':
      return 'Task failed. Please retry.';
    default:
      return 'Unknown status received.';
  }
}
console.log('Status completed: ', getNotificationMessage('completed'));
console.log('Status unexpected:', getNotificationMessage('archived'));


// ============================================================================
// 4. Ternary Operator
// ============================================================================
// CONCEPT: ternary

console.log('\n--- 4. Ternary Operator ---');

const age = 19;
const accessStatus = age >= 18 ? 'Adult Access Granted' : 'Minor Access Restricted';
console.log('Access check:', accessStatus);


// ============================================================================
// 5. Loops (for, while, forEach, for...of, for...in)
// ============================================================================
console.log('\n--- 5. Loops Comparison & Best Practices ---');

// 5.1 for loop
// WHEN TO USE: When you need an index counter or need to step in custom increments (e.g., i += 2)
// CONCEPT: for-loop
console.log('--- for loop ---');
for (let i = 1; i <= 3; i++) {
  console.log(`Count ${i}`);
}

// 5.2 while loop
// WHEN TO USE: When iterations depend on a dynamic condition rather than a fixed count (e.g., date streak check)
// CONCEPT: while-loop
console.log('--- while loop ---');
let power = 1;
while (power < 16) {
  console.log(`Power of 2: ${power}`);
  power *= 2;
}

// 5.3 Array.prototype.forEach
// WHEN TO USE: Functional iteration over arrays where you want clean callback syntax and do NOT need to break early
// CONCEPT: forEach
console.log('--- forEach ---');
const fruits = ['Apple', 'Banana', 'Cherry'];
fruits.forEach((fruit, index) => {
  console.log(`Fruit #${index + 1}: ${fruit}`);
});

// 5.4 for...of loop
// WHEN TO USE: Iterating over iterable collections (Arrays, Strings, Sets, Maps) when you want clean syntax AND support break/continue
// CONCEPT: for-of
console.log('--- for...of loop ---');
const stack = ['HTML', 'CSS', 'JavaScript'];
for (const tech of stack) {
  console.log(`Tech item: ${tech}`);
}

// 5.5 for...in loop
// WHEN TO USE: Iterating over enumerable property keys of a plain object (rarely used on arrays!)
// CONCEPT: for-in
console.log('--- for...in loop ---');
const projectConfig = { title: 'Linkific Day 2', version: '1.0.0', author: 'Ronit' };
for (const key in projectConfig) {
  if (Object.hasOwn(projectConfig, key)) {
    console.log(`Config [${key}] = ${projectConfig[key]}`);
  }
}
