/**
 * object-manipulation.js
 * Demonstrates Object static methods (keys, values, entries),
 * immutable object merging and overriding with spread,
 * and computed property names for lookup dictionary generation.
 */

import { products, users } from './data.js';

console.log('====================================================');
console.log('       OBJECT MANIPULATION EXERCISES (O1 - O3)      ');
console.log('====================================================\n');

// ============================================================================
// Exercise O1: Object.keys, Object.values, Object.entries
// Prompt: Inspect the shape and contents of a product object using Object methods.
// ============================================================================
// CONCEPT: Object.keys/values/entries

const sampleProduct = products[0]; // Wireless Mechanical Keyboard

console.log('// Exercise O1: Object.keys, Object.values, Object.entries');
console.log('Sample Product Object:', sampleProduct);

// Object.keys: returns an array of the object's own enumerable property names
const productKeys = Object.keys(sampleProduct);
console.log('\nObject.keys(sampleProduct):');
console.log(productKeys);
// Expected: [ 'id', 'name', 'price', 'category', 'inStock' ]

// Object.values: returns an array of the object's own enumerable property values
const productValues = Object.values(sampleProduct);
console.log('\nObject.values(sampleProduct):');
console.log(productValues);
// Expected: [ 'p-1', 'Wireless Mechanical Keyboard', 2499, 'Electronics', true ]

// Object.entries: returns an array of [key, value] pairs
const productEntries = Object.entries(sampleProduct);
console.log('\nObject.entries(sampleProduct):');
console.log(productEntries);
// Iterating over key-value pairs with destructuring
console.log('\nFormatted key-value table:');
for (const [key, value] of Object.entries(sampleProduct)) {
  console.log(`  ${key.padEnd(12)} : ${value}`);
}


// ============================================================================
// Exercise O2: Merge and override objects with spread (without mutation)
// Prompt: Merge user profile with settings and apply overrides immutably.
// ============================================================================
// CONCEPT: object-spread

console.log('\n// Exercise O2: Merge & Override Objects with Spread');

const defaultUserPreferences = {
  theme: 'dark',
  notifications: true,
  language: 'en-IN',
  itemsPerPage: 10,
};

const userCustomPreferences = {
  notifications: false, // user overrides default
  itemsPerPage: 25,     // user overrides default
};

// Merging default and custom settings into a new object without mutating either
const resolvedPreferences = {
  ...defaultUserPreferences,
  ...userCustomPreferences,
  lastUpdated: '2026-10-26',
};

console.log('Default Preferences (unmutated):', defaultUserPreferences);
console.log('Custom Overrides (unmutated):   ', userCustomPreferences);
console.log('Resolved Preferences (merged):  ', resolvedPreferences);


// ============================================================================
// Exercise O3: Computed property names to build a lookup object
// Prompt: Transform an array of users into a fast O(1) lookup dictionary keyed by id.
// ============================================================================
// CONCEPT: computed-properties

console.log('\n// Exercise O3: Computed Property Names for Lookup Map');

// Building an ID lookup dictionary using reduce and computed property names
const usersById = users.reduce((lookup, user) => {
  return {
    ...lookup,
    [`user_${user.id}`]: user,
  };
}, {});

console.log('Generated Lookup Keys:', Object.keys(usersById));
console.log('Fast O(1) lookup for user_3:', usersById['user_3']);
// Expected: { id: 3, name: 'Priya Patel', age: 24, email: 'priya@example.com' }
