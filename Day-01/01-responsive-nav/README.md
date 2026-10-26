# Project 01: Responsive Navigation Menu

An accessible, responsive navigation system engineered using **Apple Human Interface Guidelines (HIG)** translucency and **Stripe-style** micro-interactions as part of **Day 1: HTML5, CSS3 & Responsive Design Training** at Linkific.

Built following the **BMAD Framework** (Breakthrough Method for Agile AI-Driven Development).

---

## 📐 Design Philosophy & Craft
- **Apple Translucency**: Translucent glass header (`backdrop-filter: saturate(180%) blur(20px)`) with hairline `1px` border (`rgba(255, 255, 255, 0.09)`).
- **Stripe Precision**: Pixel-perfect alignment, pill-shaped call-to-action button, and subtle hover elevation.
- **Restraint Over Fluff**: Zero tacky neon gradients, zero bulky 3-line hamburgers. Instead, an Apple-inspired 2-line minimal toggle that rotates into an elegant '✕'.

---

## 🎯 Architecture & Semantic Tree

```text
<header class="site-header">
  └── <div class="nav-container">
        ├── <a class="brand"> (Circular avatar logo & site identity)
        ├── <input type="checkbox" id="nav-toggle-input"> (Pure CSS checkbox state)
        ├── <label for="nav-toggle-input"> (Two-line minimal toggle)
        └── <nav class="primary-nav" aria-label="Primary navigation">
              ├── <ul class="nav-list"> (Semantic list of routes)
              │     ├── <li><a class="nav-link" href="#about">About</a></li>
              │     └── <li><a class="nav-link" href="#contact">Contact</a></li>
              └── <div class="nav-cta-wrapper">
                    └── <a class="nav-cta">Resume ↗</a>
```

---

## 📱 Viewport Breakpoints Tested

| Viewport Tier | Width Range | Layout & Interaction Behavior |
| :--- | :--- | :--- |
| **Desktop** | `≥ 1024px` | 54px sticky frosted bar; balanced 3-zone flex layout (`brand` \| `links` \| `cta`); muted text shifts to full contrast on hover. |
| **Tablet** | `768px – 1023px` | Compact horizontal flex layout (`gap: 16px – 20px`); preserves visible links without premature hamburger collapse. |
| **Mobile** | `< 768px` | 48px header; 2-line toggle morphs into '✕'; reveals a full-sheet frosted glass menu with **52px touch targets** (exceeding Apple's 44x44pt rule) and full-width bottom CTA. |

---

## ♿ Accessibility (a11y) Verification

- **Semantic Landmarks**: `<header>` and `<nav aria-label="Primary navigation">` allow assistive technology to jump directly to site navigation.
- **Screen Reader Announcements**: `<ul>` and `<li>` announce item count (e.g. *"List, 4 items"*).
- **State Synchronization**: `aria-expanded` strictly mirrors the drawer's visibility (`false` when closed, `true` when open).
- **Keyboard Dismiss**: Pressing `Escape` closes the mobile sheet and restores focus to the toggle button (WCAG 2.1 Success Criterion 2.1.2).
- **Focus Indicators**: Visible high-contrast focus rings (`:focus-visible`) for keyboard navigation.

---

## 🚀 How to Run & Verify Locally
1. In VS Code, right-click [`index.html`](./index.html) → **"Open with Live Server"**.
2. Press `Cmd + Option + I` to open DevTools, toggle Device Mode (`Cmd + Shift + M`), and inspect across:
   - **Mobile**: 375px (iPhone SE)
   - **Tablet**: 768px (iPad)
   - **Desktop**: 1200px (MacBook / Monitor)
