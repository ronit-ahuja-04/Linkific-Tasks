# Technical Guide: JavaScript Module Systems (CommonJS vs. ES Modules)

Understanding how JavaScript packages structure, export, and load code is fundamental to modern full-stack engineering.

---

## 1. Overview of the Two Systems

| Feature | CommonJS (CJS) | ES Modules (ESM) |
|---|---|---|
| **Standard Origin** | Node.js ecosystem (2009) | ECMAScript Official Standard (ES6 / 2015) |
| **Syntax** | `const pkg = require('./pkg')` / `module.exports = ...` | `import pkg from './pkg.js'` / `export default ...` |
| **Loading Phase** | **Dynamic & Synchronous** (loaded at runtime when encountered) | **Static & Asynchronous** (parsed before code executes) |
| **Tree Shaking** | Difficult (dynamic nature prevents static dead-code analysis) | Supported natively by modern bundlers (Vite, Rollup, Webpack) |
| **Top-Level Await**| Not supported natively | Supported out of the box |
| **Default File Ext**| `.cjs` or `.js` without `"type": "module"` | `.mjs` or `.js` with `"type": "module"` in `package.json` |
| **Scope Globals** | Has `__dirname`, `__filename`, `require` | Uses `import.meta.url` (no `__dirname` or `require`) |

---

## 2. CommonJS (CJS)
CommonJS was designed for server-side JavaScript before browsers supported official module syntax.

### Syntax
```javascript
// Exporting in CJS (legacy.cjs)
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

module.exports = {
  calculateTotal,
};

// Importing in CJS
const { calculateTotal } = require('./legacy.cjs');
```

### Characteristics
* Synchronous execution blocks subsequent code until the module finishes loading.
* Conditional imports are valid: `if (condition) require('./module')`.

---

## 3. ES Modules (ESM)
ES Modules represent the official, universal standard adopted by both modern browsers and modern Node.js versions (Node 14+).

### Syntax
```javascript
// Exporting in ESM (math.js)
export function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Importing in ESM
import { calculateTotal } from './math.js';
```

### Characteristics
* Static structure allows compilers and linters to verify exports before executing a single line of code.
* File extensions (`.js`) are mandatory in native ESM import paths.
* Replaces legacy `__dirname` with `import.meta.url`:
  ```javascript
  import { fileURLToPath } from 'node:url';
  import { dirname } from 'node:path';
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  ```

---

## 4. How Node.js Selects the Module Loader
1. **`package.json` Manifest:**
   * `"type": "module"`: Treats all `.js` files as ES Modules.
   * `"type": "commonjs"` (or omitted): Treats all `.js` files as CommonJS.
2. **Explicit File Extensions (Override):**
   * `.mjs`: **Always** treated as ES Module regardless of `package.json`.
   * `.cjs`: **Always** treated as CommonJS regardless of `package.json`.

---

## 5. Interoperability (How They Talk to Each Other)
In our project (`repo-report`):
* `package.json` specifies `"type": "module"`.
* Our legacy module is named `src/legacy.cjs` to force Node to treat it as CommonJS.
* In our ESM entrypoint (`src/index.js`), we import the CommonJS module seamlessly via default import:
  ```javascript
  import legacyBannerModule from './legacy.cjs';
  const { getSystemBanner, formatBannerText } = legacyBannerModule;
  ```

### The Golden Rule of Interop
* **ESM can import CommonJS** directly via `import pkg from './legacy.cjs'`.
* **CommonJS cannot synchronously `require()` pure ES Modules** because ESM loading is asynchronous. (Must use dynamic `import('./esm.js')` returning a promise).

---

## 6. When to Use Which
* **Use ES Modules (ESM):**
  * All modern greenfield frontend and backend applications.
  * Publishing new npm packages for maximum compatibility.
  * When utilizing tree-shaking, top-level await, or modern build tools.
* **Use CommonJS (CJS):**
  * Maintaining legacy Node.js codebases.
  * Configuration files for older tools (e.g., legacy webpack configs or jest configs).
