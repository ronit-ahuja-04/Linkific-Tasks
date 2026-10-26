/**
 * 04-es6-features.js
 * Demonstrates ES6+ syntactic enhancements: template literals,
 * array and object destructuring, spread/rest, object shorthand,
 * and computed property names.
 */

// ============================================================================
// 1. Template Literals & Multi-line Strings
// ============================================================================
// CONCEPT: template-literals

console.log('--- 1. Template Literals ---');

const studentName = 'Ronit Ahuja';
const dayNumber = 2;
const topic = 'JavaScript & ES6+';

// String interpolation with expressions
const summary = `Day ${dayNumber}: ${studentName} is mastering ${topic} (Progress: ${Math.round((dayNumber / 30) * 100)}%)`;
console.log(summary);

// Multi-line formatting without explicit \n
const multilineCard = `
=========================
  Profile: ${studentName}
  Role: Software Intern
=========================
`;
console.log(multilineCard.trim());


// ============================================================================
// 2. Destructuring (Arrays & Objects)
// ============================================================================
// CONCEPT: destructuring

console.log('\n--- 2. Destructuring ---');

// 2.1 Array Destructuring (order-based)
const rgb = [255, 140, 0];
const [red, green, blue] = rgb;
console.log(`RGB components -> R: ${red}, G: ${green}, B: ${blue}`);

// Skipping elements and rest in arrays
const rankings = ['Gold', 'Silver', 'Bronze', 'Participant 1', 'Participant 2'];
const [firstPlace, , thirdPlace, ...others] = rankings;
console.log(`1st: ${firstPlace}, 3rd: ${thirdPlace}, Honorable Mentions: ${others.join(', ')}`);

// Variable swapping using destructuring
let x = 10;
let y = 20;
[x, y] = [y, x];
console.log(`Swapped: x=${x}, y=${y}`);

// 2.2 Object Destructuring (key-based)
const intern = {
  id: 'INT-104',
  fullName: 'Ronit Ahuja',
  company: 'Linkific',
  contact: { email: 'ronit@example.com', city: 'Delhi' }
};

// Renaming, default values, and nested destructuring
const {
  fullName: displayName,
  role = 'Intern',
  contact: { email, city }
} = intern;
console.log(`User: ${displayName} (${role}), Contact: ${email} in ${city}`);


// ============================================================================
// 3. Spread Operator (Arrays & Objects)
// ============================================================================
// CONCEPT: spread-operator

console.log('\n--- 3. Spread Operator ---');

// 3.1 Array Spread (shallow copy and merging without mutating original)
const frontendCore = ['HTML', 'CSS'];
const frontendAdvanced = ['JavaScript', 'React'];
const fullStackSkills = [...frontendCore, ...frontendAdvanced, 'Node.js'];
console.log('Original frontendCore (unmutated):', frontendCore);
console.log('Merged skills array:               ', fullStackSkills);

// 3.2 Object Spread (shallow copy and immutable overrides)
const initialHabit = {
  id: 'h-1',
  name: 'Code for 1 hour',
  streak: 5,
  completedToday: false
};

// Creating a brand new object with updated property (no mutation!)
const updatedHabit = {
  ...initialHabit,
  streak: initialHabit.streak + 1,
  completedToday: true
};
console.log('Initial habit (unmutated):', initialHabit);
console.log('Updated habit (new state):', updatedHabit);


// ============================================================================
// 4. Object Shorthand Syntax
// ============================================================================
// CONCEPT: object-shorthand

console.log('\n--- 4. Object Property & Method Shorthand ---');

const projectTitle = 'Habit Tracker';
const category = 'Productivity';
const isComplete = false;

// When key name matches variable name, no need for key: variable
const projectRecord = {
  projectTitle,
  category,
  isComplete,
  // Method shorthand (replaces getStatus: function() {})
  getStatus() {
    return `${this.projectTitle} is ${this.isComplete ? 'Done' : 'In Progress'}`;
  }
};
console.log('Object created with shorthand:', projectRecord);
console.log('Method shorthand output:      ', projectRecord.getStatus());


// ============================================================================
// 5. Computed Property Names
// ============================================================================
// CONCEPT: computed-properties

console.log('\n--- 5. Computed Property Names ---');

// Dynamic key computed at runtime
const storageKeyPrefix = 'day2';
const entityName = 'habits';

const dynamicStorageConfig = {
  [`${storageKeyPrefix}.${entityName}.v1`]: 'localStorageKey',
  [`${storageKeyPrefix}.${entityName}.cacheTime`]: 3600
};
console.log('Computed keys config:', dynamicStorageConfig);
