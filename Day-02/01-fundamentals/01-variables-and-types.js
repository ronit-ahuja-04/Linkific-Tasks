/**
 * 01-variables-and-types.js
 * Demonstrates variable declarations (var, let, const), hoisting, scope,
 * all JavaScript data types, null vs undefined, and equality operators.
 */

// ============================================================================
// 1. Variable Declarations: var vs let vs const (Scope & Hoisting)
// ============================================================================
// CONCEPT: let-const-var

console.log('--- 1. Variable Declarations & Scope ---');

// var is function-scoped (or globally scoped) and gets hoisted with value undefined
function demonstrateVarHoisting() {
  console.log('Value of hoistedVar before declaration:', hoistedVar); // undefined (not ReferenceError)
  var hoistedVar = 'I was hoisted!';
  console.log('Value of hoistedVar after declaration:', hoistedVar);

  if (true) {
    var functionScoped = 'Accessible throughout function';
  }
  console.log('Outside block, functionScoped is:', functionScoped); // Accessible!
}
demonstrateVarHoisting();

// let and const are block-scoped and stay in the Temporal Dead Zone (TDZ) until declaration
function demonstrateBlockScope() {
  // Accessing letVar or constVar here would throw: ReferenceError: Cannot access before initialization
  if (true) {
    let blockScopedLet = 'Only exists in this block';
    const blockScopedConst = 'Immutable reference in this block';
    console.log('Inside block:', blockScopedLet, '|', blockScopedConst);
  }
  // console.log(blockScopedLet); // Would throw ReferenceError
}
demonstrateBlockScope();

// const prevents variable reassignment, but objects/arrays remain mutable
const user = { name: 'Ronit', role: 'Intern' };
user.role = 'Frontend Developer'; // Allowed (mutation of property)
console.log('Mutated const object:', user);
// user = {}; // TypeError: Assignment to constant variable.


// ============================================================================
// 2. JavaScript Data Types (typeof checks)
// ============================================================================
// CONCEPT: data-types

console.log('\n--- 2. Data Types & typeof ---');

// 7 Primitive types: string, number, bigint, boolean, undefined, symbol, null
const sampleString = 'Hello, Linkific!';
const sampleNumber = 42;
const sampleBigInt = 9007199254740991n;
const sampleBoolean = true;
let sampleUndefined; // value is undefined
const sampleSymbol = Symbol('uniqueKey');
const sampleNull = null;

// 1 Reference type: object (includes Array, Function, plain Object, Date, etc.)
const sampleObject = { brand: 'Apple', model: 'MacBook' };
const sampleArray = [1, 2, 3];
const sampleFunction = function () {
  return 'executing';
};

console.log('sampleString:   ', typeof sampleString);     // "string"
console.log('sampleNumber:   ', typeof sampleNumber);     // "number"
console.log('sampleBigInt:   ', typeof sampleBigInt);     // "bigint"
console.log('sampleBoolean:  ', typeof sampleBoolean);    // "boolean"
console.log('sampleUndefined:', typeof sampleUndefined);  // "undefined"
console.log('sampleSymbol:   ', typeof sampleSymbol);     // "symbol"
console.log('sampleNull:     ', typeof sampleNull);       // "object" -> Historical JS quirk!
console.log('sampleObject:   ', typeof sampleObject);     // "object"
console.log('sampleArray:    ', typeof sampleArray);      // "object" (use Array.isArray to distinguish)
console.log('sampleFunction: ', typeof sampleFunction);   // "function" (objects with [[Call]])


// ============================================================================
// 3. null vs undefined
// ============================================================================
// CONCEPT: null-vs-undefined

console.log('\n--- 3. null vs undefined ---');

// undefined: variable declared but not yet assigned, or missing function argument / return
let unassignedVariable;
console.log('Unassigned variable:', unassignedVariable); // undefined

// null: intentional representation of an empty or nonexistent object value
const activeSession = null; // Intentionally empty
console.log('Intentional empty state:', activeSession);

console.log('Loose equality (null == undefined):', null == undefined);   // true (both represent absence of value)
console.log('Strict equality (null === undefined):', null === undefined); // false (different types)


// ============================================================================
// 4. Loose Equality (==) vs Strict Equality (===) Gotchas
// ============================================================================
// CONCEPT: strict-equality

console.log('\n--- 4. Loose (==) vs Strict (===) Equality ---');

// Loose equality (==) coerces operands to the same type before comparison
console.log("0 == '0'       ->", 0 == '0');             // true  (string '0' coerced to number 0)
console.log("0 === '0'      ->", 0 === '0');            // false (different types: number vs string)

console.log("false == '0'   ->", false == '0');         // true  (both coerced to number 0)
console.log("false === '0'  ->", false === '0');        // false

console.log("[] == false    ->", [] == false);          // true  ([] coerced to '', then to 0)
console.log("[] === false   ->", [] === false);         // false

console.log("'' == 0        ->", '' == 0);              // true  ('' coerced to 0)
console.log("'' === 0       ->", '' === 0);             // false

// NaN gotcha: NaN is never equal to anything, including itself
console.log('NaN === NaN    ->', NaN === NaN);          // false (use Number.isNaN(val) instead)
console.log('Number.isNaN(NaN):', Number.isNaN(NaN));   // true
