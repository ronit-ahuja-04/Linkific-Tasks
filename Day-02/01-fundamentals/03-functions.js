/**
 * 03-functions.js
 * Demonstrates function declarations, expressions, arrow functions,
 * implicit returns, default parameters, rest parameters, and callbacks.
 */

// ============================================================================
// 1. Function Declaration (Hoisted to top of enclosing scope)
// ============================================================================
// CONCEPT: function-declaration

console.log('--- 1. Function Declaration ---');

// Can be invoked before its declaration in code due to hoisting
console.log('Hoisted call:', calculateTax(1000, 0.18));

/**
 * Calculates tax on a base amount.
 * @param {number} amount - Base price
 * @param {number} rate - Tax rate (e.g. 0.18 for 18%)
 * @returns {number} Computed tax amount
 */
function calculateTax(amount, rate) {
  return amount * rate;
}


// ============================================================================
// 2. Function Expression (Anonymous or named, NOT hoisted)
// ============================================================================
// CONCEPT: function-expression

console.log('\n--- 2. Function Expression ---');

// Stored in a variable; invoking before this line causes ReferenceError
const calculateDiscount = function (price, discountPercent) {
  return price * (discountPercent / 100);
};
console.log('Discount (500 with 10% off):', calculateDiscount(500, 10));


// ============================================================================
// 3. Arrow Function & Implicit Return
// ============================================================================
// CONCEPT: arrow-functions

console.log('\n--- 3. Arrow Functions & Implicit Return ---');

// Block body arrow function
const formatCurrency = (amount, symbol = '₹') => {
  return `${symbol}${amount.toFixed(2)}`;
};
console.log('Formatted currency:', formatCurrency(499));

// Single-expression arrow function with implicit return (no curly braces, no return keyword)
const multiply = (x, y) => x * y;
console.log('Implicit return (6 * 7):', multiply(6, 7));


// ============================================================================
// 4. Default Parameters
// ============================================================================
// CONCEPT: default-parameters

console.log('\n--- 4. Default Parameters ---');

/**
 * Greets a user with customizable greeting and punctuation.
 * @param {string} [name='Guest'] - User name
 * @param {string} [greeting='Welcome'] - Greeting text
 * @returns {string} Assembled greeting
 */
function greetUser(name = 'Guest', greeting = 'Welcome') {
  return `${greeting}, ${name}!`;
}
console.log('Default values:   ', greetUser());
console.log('Specified values: ', greetUser('Ronit', 'Hello'));


// ============================================================================
// 5. Rest Parameters (...nums)
// ============================================================================
// CONCEPT: rest-parameters

console.log('\n--- 5. Rest Parameters ---');

/**
 * Sums an arbitrary number of numeric arguments into a total.
 * @param {...number} numbers - Numbers to sum
 * @returns {number} The total sum
 */
function sumNumbers(...numbers) {
  return numbers.reduce((accumulator, current) => accumulator + current, 0);
}
console.log('Sum (1, 2, 3):       ', sumNumbers(1, 2, 3));
console.log('Sum (10, 20, 30, 40):', sumNumbers(10, 20, 30, 40));
console.log('Sum with no args:    ', sumNumbers());


// ============================================================================
// 6. Higher-Order Functions with Callbacks
// ============================================================================
// CONCEPT: callback-functions

console.log('\n--- 6. Functions Accepting Callbacks ---');

/**
 * Transforms an array using a supplied callback function (similar to Array.map).
 * @template T, U
 * @param {T[]} array - Input array
 * @param {function(T, number): U} callback - Transformation function
 * @returns {U[]} Transformed array
 */
function transformList(array, callback) {
  const result = [];
  for (let i = 0; i < array.length; i++) {
    result.push(callback(array[i], i));
  }
  return result;
}

const originalNumbers = [2, 4, 6, 8];
const squaredNumbers = transformList(originalNumbers, (num) => num * num);
console.log('Original numbers:', originalNumbers);
console.log('Squared via custom HOF callback:', squaredNumbers);
