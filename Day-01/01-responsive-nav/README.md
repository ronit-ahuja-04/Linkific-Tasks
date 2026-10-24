# Project 01: Responsive Navigation Menu

A modern, accessible, and responsive navigation header built with semantic HTML5 and CSS3 Flexbox as part of **Day 1: HTML5, CSS3 & Responsive Design Training** at Linkific.

---

## 🌟 Key Features
- **Semantic HTML5 Structure**: Built with `<header>`, `<nav>`, `<ul>`, `<li>`, and `<button>` elements ensuring correct document outline.
- **Accessible (a11y)**: Includes an accessible keyboard skip-link (`.skip-link`), `aria-label`, and interactive `aria-expanded` toggle states.
- **Modern Flexbox Layout**:
  - Horizontal alignment on desktop with `justify-content: space-between` and `align-items: center`.
  - Nested submenu dropdown with hover/focus states.
- **Mobile-Responsive Drawer**:
  - Transforms into a smooth side-drawer navigation below `868px`.
  - CSS animated hamburger icon transforming into an 'X'.
  - Blurred backdrop overlay and scroll-locking when open.
  - Keyboard accessible (closes on `Escape` key).
- **Glassmorphic Aesthetic**: Sticky header with CSS `backdrop-filter: blur(16px)` and scroll-activated elevation shadow.

---

## 📐 Breakpoints Tested
| Viewport | Screen Width | Navigation Behavior |
| :--- | :--- | :--- |
| **Mobile** | `375px` | Compact bar with logo and hamburger; drawer slides from right |
| **Tablet** | `768px` | Drawer navigation with full-width action buttons |
| **Desktop** | `1200px+` | Full horizontal menu with dropdown & primary CTA |

---

## 💡 Key Learnings & Takeaways
1. **Flexbox 1D Power**: Flexbox excels at single-dimensional alignment (header rows, horizontal pill lists, vertical drawers).
2. **ARIA Synchronization**: Keeping `aria-expanded` synchronized with the menu state is essential for screen reader users.
3. **Box Sizing & Reset**: Setting `box-sizing: border-box` across all elements eliminates calculation bugs when applying padding to navigation links.

---

## 🚀 How to Run Locally
Open `index.html` using the VS Code **Live Server** extension (`Go Live` in status bar) or directly in any modern browser.
