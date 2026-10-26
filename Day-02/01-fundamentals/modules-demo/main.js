/**
 * main.js - ES Module Demonstrating Named and Default Imports
 */
// CONCEPT: es-modules

import calculator, { add, subtract, multiply, divide, PI } from './math.js';

console.log('--- ES Modules Demo (main.js) ---');
console.log('Value of PI (named import):', PI);
console.log('add(15, 25):               ', add(15, 25));
console.log('subtract(50, 18):          ', subtract(50, 18));
console.log('multiply(7, 8):            ', multiply(7, 8));
console.log('divide(100, 4):            ', divide(100, 4));
console.log('calculator default object: ', calculator);

// If running in browser environment, update DOM
if (typeof document !== 'undefined') {
  const outputEl = document.getElementById('demo-output');
  if (outputEl) {
    const list = document.createElement('ul');

    const items = [
      `PI: ${PI}`,
      `add(15, 25) = ${add(15, 25)}`,
      `subtract(50, 18) = ${subtract(50, 18)}`,
      `multiply(7, 8) = ${multiply(7, 8)}`,
      `divide(100, 4) = ${divide(100, 4)}`,
    ];

    items.forEach((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      list.appendChild(li);
    });

    outputEl.appendChild(list);
  }
}
