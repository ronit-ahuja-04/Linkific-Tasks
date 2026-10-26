/**
 * exercises.js
 * 21 Array Method Exercises covering map, filter, reduce, find, findIndex,
 * some, every, sort, and method chaining.
 */

import { numbers, users, products, students, mixedValues, wordList } from './data.js';

console.log('====================================================');
console.log('   21 JAVASCRIPT ARRAY METHOD EXERCISES (ES6+)     ');
console.log('====================================================\n');

// ============================================================================
// Exercise 1: Square every number
// Method: map
// Prompt: Transform each number in an array into its square.
// ============================================================================
// CONCEPT: map
const squaredNumbers = numbers.map((n) => n * n);
console.log('// Exercise 1: Square every number');
console.log('Result:', squaredNumbers);
// Expected: [ 144, 25, 64, 16900, 1936, 9, 49, 400 ]


// ============================================================================
// Exercise 2: Extract names from an array of user objects
// Method: map
// Prompt: Extract an array containing only the string names of all users.
// ============================================================================
// CONCEPT: map
const userNames = users.map((user) => user.name);
console.log('\n// Exercise 2: Extract names from user objects');
console.log('Result:', userNames);
// Expected: [ 'Ronit Ahuja', 'Aarav Sharma', 'Priya Patel', 'Diya Verma', 'Kabir Mehta' ]


// ============================================================================
// Exercise 3: Format prices with template literals
// Method: map
// Prompt: Format numeric product prices into formatted currency strings (e.g. ₹499.00).
// ============================================================================
// CONCEPT: map
const formattedPrices = products.map((product) => `₹${product.price.toFixed(2)}`);
console.log('\n// Exercise 3: Format prices with template literals');
console.log('Result:', formattedPrices);
// Expected: [ '₹2499.00', '₹349.00', '₹299.00', '₹4999.00', '₹199.00', '₹899.00' ]


// ============================================================================
// Exercise 4: Add an isAdult flag with spread without mutating original
// Method: map
// Prompt: Create a new array of users where each object has an `isAdult` boolean flag.
// ============================================================================
// CONCEPT: map
const usersWithAdultFlag = users.map((user) => ({
  ...user,
  isAdult: user.age >= 18,
}));
console.log('\n// Exercise 4: Add isAdult flag immutably');
console.table(usersWithAdultFlag);
// Expected: [{ id: 1, isAdult: true }, { id: 2, isAdult: false }, ... ]


// ============================================================================
// Exercise 5: Keep even numbers
// Method: filter
// Prompt: Filter an array to retain only the even integers.
// ============================================================================
// CONCEPT: filter
const evenNumbers = numbers.filter((n) => n % 2 === 0);
console.log('\n// Exercise 5: Keep even numbers');
console.log('Result:', evenNumbers);
// Expected: [ 12, 8, 130, 44, 20 ]


// ============================================================================
// Exercise 6: Products under ₹500
// Method: filter
// Prompt: Filter the products array to return items priced strictly below ₹500.
// ============================================================================
// CONCEPT: filter
const budgetProducts = products.filter((p) => p.price < 500);
console.log('\n// Exercise 6: Products under ₹500');
console.table(budgetProducts);
// Expected: 3 items (Ergonomic Mousepad ₹349, Type-C Fast Charging Cable ₹299, Ceramic Coffee Mug ₹199)


// ============================================================================
// Exercise 7: Remove falsy values with filter(Boolean)
// Method: filter
// Prompt: Clean an array containing truthy and falsy values, keeping only truthy items.
// ============================================================================
// CONCEPT: filter
const truthyValues = mixedValues.filter(Boolean);
console.log('\n// Exercise 7: Remove falsy values with filter(Boolean)');
console.log('Result:', truthyValues);
// Expected: [ 'hello', 42, 'JavaScript', true ]


// ============================================================================
// Exercise 8: Case-insensitive search by name
// Method: filter
// Prompt: Find all users whose names contain the substring "ya" (case-insensitive).
// ============================================================================
// CONCEPT: filter
function searchUsersByName(query, list) {
  const normalizedQuery = query.trim().toLowerCase();
  return list.filter((user) => user.name.toLowerCase().includes(normalizedQuery));
}
const matchedUsers = searchUsersByName('ya', users);
console.log('\n// Exercise 8: Case-insensitive search by name ("ya")');
console.log('Result:', matchedUsers.map((u) => u.name));
// Expected: [ 'Priya Patel', 'Diya Verma' ]


// ============================================================================
// Exercise 9: Sum of numbers
// Method: reduce
// Prompt: Compute the total sum of all numbers in the numbers array.
// ============================================================================
// CONCEPT: reduce
const totalSum = numbers.reduce((accumulator, current) => accumulator + current, 0);
console.log('\n// Exercise 9: Sum of numbers');
console.log('Result:', totalSum);
// Expected: 229


// ============================================================================
// Exercise 10: Maximum value
// Method: reduce
// Prompt: Find the maximum number in an array using reduce.
// ============================================================================
// CONCEPT: reduce
const maxNumber = numbers.reduce(
  (max, current) => (current > max ? current : max),
  numbers[0]
);
console.log('\n// Exercise 10: Maximum value');
console.log('Result:', maxNumber);
// Expected: 130


// ============================================================================
// Exercise 11: Group products by category into an object
// Method: reduce
// Prompt: Group product objects into an object keyed by their category name.
// ============================================================================
// CONCEPT: reduce
const productsByCategory = products.reduce((acc, product) => {
  const category = product.category;
  if (!acc[category]) {
    acc[category] = [];
  }
  acc[category].push(product);
  return acc;
}, {});
console.log('\n// Exercise 11: Group products by category');
console.log('Result:', Object.keys(productsByCategory));
// Expected: { Electronics: [...], Accessories: [...], Lifestyle: [...] }


// ============================================================================
// Exercise 12: Word frequency count
// Method: reduce
// Prompt: Count occurrences of each word in an array, returning a frequency map.
// ============================================================================
// CONCEPT: reduce
const wordFrequency = wordList.reduce((acc, word) => {
  acc[word] = (acc[word] ?? 0) + 1;
  return acc;
}, {});
console.log('\n// Exercise 12: Word frequency count');
console.log('Result:', wordFrequency);
// Expected: { javascript: 3, frontend: 2, react: 2, node: 1, es6: 1 }


// ============================================================================
// Exercise 13: Find a user by id
// Method: find
// Prompt: Locate the first user object whose id matches 3.
// ============================================================================
// CONCEPT: find
const userWithId3 = users.find((user) => user.id === 3);
console.log('\n// Exercise 13: Find a user by id');
console.log('Result:', userWithId3);
// Expected: { id: 3, name: 'Priya Patel', age: 24, email: 'priya@example.com' }


// ============================================================================
// Exercise 14: Find index and remove item without mutating original
// Method: findIndex
// Prompt: Find index of product 'p-3', then produce a new array without that item.
// ============================================================================
const targetId = 'p-3';
const targetIndex = products.findIndex((p) => p.id === targetId);
// Immutable deletion using slice
const productsWithoutTarget = [
  ...products.slice(0, targetIndex),
  ...products.slice(targetIndex + 1),
];
console.log('\n// Exercise 14: findIndex and immutable removal');
console.log(`Index of ${targetId}:`, targetIndex);
console.log('Original count:', products.length, '| New count:', productsWithoutTarget.length);
// Expected: targetIndex is 2, productsWithoutTarget length is 5


// ============================================================================
// Exercise 15: Is anything out of stock?
// Method: some
// Prompt: Check if at least one product has inStock === false.
// ============================================================================
// CONCEPT: some
const hasOutOfStockItems = products.some((p) => !p.inStock);
console.log('\n// Exercise 15: Is anything out of stock?');
console.log('Result:', hasOutOfStockItems);
// Expected: true


// ============================================================================
// Exercise 16: Did every student pass? (mark >= 40)
// Method: every
// Prompt: Verify if every student in the dataset achieved marks >= 40.
// ============================================================================
// CONCEPT: every
const allStudentsPassed = students.every((student) => student.mark >= 40);
console.log('\n// Exercise 16: Did every student pass?');
console.log('Result:', allStudentsPassed);
// Expected: true (lowest mark is 42)


// ============================================================================
// Exercise 17: Numbers ascending and descending (Gotcha demonstration)
// Method: sort
// Prompt: Show why default .sort() fails for numbers, and sort ascending & descending.
// ============================================================================
// CONCEPT: sort
const testNumbers = [12, 5, 8, 130, 44];
const defaultLexicalSort = [...testNumbers].sort(); // Gotcha: converts to strings! "130" comes before "44"
const sortedAscending = [...testNumbers].sort((a, b) => a - b);
const sortedDescending = [...testNumbers].sort((a, b) => b - a);

console.log('\n// Exercise 17: Number sorting gotcha and correct numeric comparator');
console.log('Default lexical sort (WRONG for numbers):', defaultLexicalSort);
console.log('Ascending numeric sort (CORRECT):        ', sortedAscending);
console.log('Descending numeric sort (CORRECT):       ', sortedDescending);
// Expected: Lexical -> [ 12, 130, 44, 5, 8 ], Ascending -> [ 5, 8, 12, 44, 130 ]


// ============================================================================
// Exercise 18: Strings with localeCompare
// Method: sort
// Prompt: Sort city and country names alphabetically using localeCompare.
// ============================================================================
// CONCEPT: sort
const cities = ['Zürich', 'Bengaluru', 'Amsterdam', 'São Paulo', 'Delhi'];
const sortedCities = [...cities].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
console.log('\n// Exercise 18: String sorting with localeCompare');
console.log('Result:', sortedCities);
// Expected: [ 'Amsterdam', 'Bengaluru', 'Delhi', 'São Paulo', 'Zürich' ]


// ============================================================================
// Exercise 19: Objects by price, copying the array first
// Method: sort
// Prompt: Sort product objects by price (cheapest first) without mutating original.
// ============================================================================
// CONCEPT: sort
const sortedProductsByPrice = [...products].sort((a, b) => a.price - b.price);
console.log('\n// Exercise 19: Objects sorted by price (cheapest to expensive)');
console.table(sortedProductsByPrice.map((p) => ({ name: p.name, price: p.price })));
// Expected: Coffee Mug (199), Fast Charging Cable (299), Mousepad (349), ...


// ============================================================================
// Exercise 20: Sort by category, then by price
// Method: sort
// Prompt: Sort products first alphabetically by category; if category matches, sort by price.
// ============================================================================
// CONCEPT: sort
const sortedByCategoryThenPrice = [...products].sort((a, b) => {
  const categoryDiff = a.category.localeCompare(b.category);
  if (categoryDiff !== 0) {
    return categoryDiff;
  }
  return a.price - b.price; // secondary sort
});
console.log('\n// Exercise 20: Sort by category, then by price');
console.table(
  sortedByCategoryThenPrice.map((p) => ({ category: p.category, name: p.name, price: p.price }))
);
// Expected: Accessories sorted by price, then Electronics by price, then Lifestyle by price


// ============================================================================
// Exercise 21: Method Chaining (filter -> map -> reduce)
// Method: Chained filter -> map -> reduce
// Prompt: Calculate total revenue if all in-stock Electronics are sold with 18% GST.
// ============================================================================
const totalElectronicsGstRevenue = products
  .filter((p) => p.category === 'Electronics' && p.inStock) // Filter only in-stock electronics
  .map((p) => p.price * 1.18)                               // Add 18% GST
  .reduce((total, priceWithTax) => total + priceWithTax, 0); // Accumulate sum

console.log('\n// Exercise 21: Chained filter -> map -> reduce');
console.log('Total Electronics with 18% GST: ₹' + totalElectronicsGstRevenue.toFixed(2));
// Expected: (2499 + 4999) * 1.18 = 7498 * 1.18 = 8847.64
