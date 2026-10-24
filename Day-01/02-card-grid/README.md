# Project 02: Responsive Card Layout with CSS Grid

A responsive 2-dimensional developer module card grid built with semantic HTML5 and CSS Grid as part of **Day 1: HTML5, CSS3 & Responsive Design Training** at Linkific.

---

## 🌟 Key Features
- **Fluid CSS Grid Layout**: Uses `grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))` to provide automatic responsiveness without requiring excessive media query overrides.
- **Semantic HTML5 Markup**:
  - Encapsulated within `<main>` and structured as independent `<article class="card">` components.
  - Heading hierarchy with `<h1>` page title, `<h2>` card titles, and semantic `<header>` and `<footer>` elements.
- **Internal Flexbox Alignment**:
  - Each card uses a vertical flex layout (`flex-direction: column`).
  - The card body uses `flex-grow: 1` and the card footer uses `margin-top: auto` so that footers and action links remain aligned across uneven content lengths.
- **Micro-Interactions**:
  - Smooth card translation (`transform: translateY(-6px)`) with glowing border transitions.
  - Tag pill badges with semi-transparent glass backgrounds and vibrant gradient headers.

---

## 📐 Grid Responsive Behavior
| Viewport | Columns Rendered | Behavior |
| :--- | :--- | :--- |
| **Mobile (`< 480px`)** | 1 Column | Full-width single column stack for effortless scrolling |
| **Tablet (`768px`)** | 2 Columns | Balanced 2-column grid utilizing available horizontal space |
| **Desktop (`1200px+`)** | 3–4 Columns | Multi-column grid capped at `max-width: 1280px` |

---

## 💡 Key Learnings & Takeaways
1. **`auto-fit` vs `auto-fill`**: `auto-fit` stretches existing columns to fill remaining container space, whereas `auto-fill` leaves empty grid tracks. For card grids, `auto-fit` provides the most aesthetically pleasing result.
2. **`minmax(320px, 1fr)`**: Establishes a lower limit to prevent cards from squishing, while `1fr` guarantees cards share leftover width proportionally.
3. **Combining Grid & Flexbox**: Grid defines the overall 2D layout of the page, while Flexbox handles 1D layout inside each individual card component.

---

## 🚀 How to Run Locally
Open `index.html` using the VS Code **Live Server** extension (`Go Live` in status bar) or directly in any modern browser.
