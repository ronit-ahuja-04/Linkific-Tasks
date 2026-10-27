# Day 3: Git, GitHub & Package Managers (`repo-report`)

A modular Node.js command-line application that queries the GitHub REST API, processes and aggregates repository metrics using lodash, formats relative dates via date-fns, and generates a structured terminal report.

---

## 🎯 Learning Objectives & Context
This repository contains the deliverables for **Month 1, Day 3** of the Linkific internship:
* **Version Control Mastery:** Feature-branch workflows, atomic conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`), and resolving merge conflicts.
* **GitHub Collaboration:** Pull Request reviews with checklists, multi-branch merges via merge commits, forking upstream repositories, and GitHub Pages.
* **Package Management (npm & yarn):** Understanding semantic versioning ranges (`^`, `~`, exact), `package.json` manifest structure, lockfile immutability, vulnerability audits (`npm audit`), and CommonJS vs. ES Module interop.

---

## 🚀 Quick Start

### Prerequisites
* **Node.js:** `>= 20.0.0`
* **npm:** `>= 10.0.0`
* **Git:** `>= 2.40.0`

### Installation
```bash
cd Day-03
npm install
```

### Basic Usage
Run the CLI tool directly with any public GitHub handle:
* `npm start -- torvalds` - Generate report for Linus Torvalds
* `npm start -- gaearon --all` - Generate report including forks and archived repos
* `npm start -- ronit-ahuja-04` - View personal repository metrics

---

## 📦 Available Scripts

| Command | Action |
|---|---|
| `npm start -- <username>` | Fetches repositories for `<username>` and prints terminal report |
| `npm run dev` | Runs the CLI with `nodemon` for active development |
| `npm run build` | Exports a deterministic JSON report to `dist/report.json` |
| `npm test` | Runs the offline test suite using native `node:test` runner |
| `npm run format` | Formats all codebase files using Prettier |
| `npm run audit:check` | Runs security audit checking for vulnerabilities |

---

## 🏗️ Project Architecture

```
Day-03/
├── README.md               # Project documentation & Git workflow guide
├── package.json            # Manifest & dependencies
├── package-lock.json       # Deterministic dependency tree
├── .gitignore              # Ignored files (node_modules, .env, dist)
├── .prettierrc             # Prettier formatting configuration
├── src/
│   ├── index.js            # CLI entry point (argument parsing & display)
│   ├── github.js           # Axios client for GitHub REST API
│   ├── report.js           # Lodash data transformation & grouping
│   ├── dates.js            # Date formatting with date-fns
│   └── legacy.cjs          # CommonJS demo module for ESM/CJS interop
├── scripts/
│   └── build.js            # Offline JSON export script
├── test/
│   ├── fixtures/repos.json # Static sample data for deterministic offline tests
│   ├── report.test.js      # Unit tests for grouping & sorting
│   └── dates.test.js       # Unit tests for date calculations
├── examples/               # Standalone runnable demonstrations
└── docs/                   # Internship practice logs & technical deep-dives
```

---

## 🔄 Git Workflow & Conventions
* **Branch Strategy:** Every task is implemented on an isolated feature branch branched from `main`. No direct commits to `main`.
* **Commit Conventions:** Follows Conventional Commits specification:
  * `feat:` A new feature
  * `fix:` A bug fix
  * `docs:` Documentation only changes
  * `chore:` Build process or tooling changes
  * `test:` Adding or refactoring tests
* **Merge Strategy:** Pull Requests are merged using **"Create a merge commit"** on GitHub to retain complete chronological history.

---

## 📄 License
MIT © 2026 Ronit Ahuja
