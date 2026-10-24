# Project 03: Mobile-First Blog & Case Studies Layout

**Author:** Ronit Ahuja  
**Program:** Linkific Training (Days 1–3: Introductory Phase)  
**Deliverable:** Day 1 — HTML5, CSS3 & Responsive Design Basics  
**Methodology:** BMAD Framework (Breakthrough Method for Agile AI-Driven Development)  
**Scope:** Strictly 100% Pure HTML5 & CSS3 (Zero JavaScript)

---

## 🌟 Project Overview
This project represents **Stage 3** of the compounding personal portfolio build. Rather than an isolated homework assignment with placeholder text, it integrates real architectural case studies (*VESIT AMS*, *Kingstar Enterprises*, *The BMAD Method*) with a complementary sticky sidebar detailing Ronit Ahuja's technical skills and educational timeline.

---

## 🏗️ Architectural Foundations

### 1. Cumulative Superset Progression
- **Inherited Foundation (Stage 1)**: Apple frosted navigation header with circular brand avatar, favicon, mobile drawer toggle, hero section, and "What I'm Doing" services.
- **Inherited Foundation (Stage 2)**: 2D CSS Grid Featured Projects showcase with pure CSS `:checked` category filtering.
- **New Stage 3 Architecture (`#writing`)**:
  - Semantic `<div class="layout-wrapper">`: Hosts the primary content stream (`<main class="writing-feed">`) alongside the sticky sidebar (`<aside class="sticky-sidebar">`).
  - Seamless in-page smooth navigation: `#about`, `#portfolio`, `#writing`, and `#contact` all function locally on the same page.

### 2. Strict Mobile-First CSS Architecture
Base CSS is authored specifically for small screen viewports without requiring media queries:
```css
/* Base Mobile Styles (< 1024px): Natural Vertical Stack */
.layout-wrapper {
  display: flex;
  flex-direction: column;
  gap: 36px;
}
```

Progressive enhancements are applied systematically via `min-width` queries:
- **Tablet (`@media (min-width: 768px)`)**: Expands vertical padding, relaxes card gutters, and arranges footer brand info horizontally.
- **Desktop (`@media (min-width: 1024px)`)**:
  ```css
  @media (min-width: 1024px) {
    .layout-wrapper {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 40px;
      align-items: start; /* Essential for sticky sidebar */
    }

    .sticky-sidebar {
      position: sticky;
      top: calc(var(--header-height) + 24px);
    }
  }
  ```

---

## 💡 Key Engineering Takeaways

1. **Prerequisites for `position: sticky` in CSS Grid**:
   - The CSS Grid default is `align-items: stretch`, which causes all grid items to stretch to equal height. A stretched aside has nowhere to scroll within its grid track. Setting `align-items: start` on `.layout-wrapper` allows the `<aside>` to retain its natural content height and stick smoothly while `<main>` scrolls.
   - Any ancestor element with `overflow: hidden`, `overflow: scroll`, or `overflow: auto` breaks sticky positioning.
2. **Semantic HTML5 Landmark Accessibility**:
   - `<main id="main-writing">`: Declares the unique primary content area.
   - `<article>`: Encapsulates self-contained case studies and articles.
   - `<aside aria-label="Author Credentials & Skills">`: Signifies complementary author details and skill ratings.
   - `<time datetime="YYYY-MM-DD">`: Machine-readable timestamps for published dates.
3. **Pure CSS Micro-Interactions**:
   - All interactive elements (mobile hamburger drawer, project filters, anchor jumps) operate without any JavaScript, utilizing CSS pseudo-classes (`:checked`, `:hover`, `:focus-visible`).

---

## 📐 Tested Viewport Matrix

| Viewport | Target Device | Layout Behavior |
| :--- | :--- | :--- |
| **375px &bull; 414px** | iPhone SE / Pro Max | 1-Column stack; mobile drawer nav; full-width cards; touch targets $\ge 44\text{px}$. |
| **768px &bull; 834px** | iPad Mini / Air | Expanded typography; horizontal footer row; inline author badges. |
| **1024px &bull; 1440px** | MacBook Air / Pro | Full 2-column asymmetric grid (`1fr 340px`); sticky `<aside>` stays fixed during scrolling. |

---

## 🚀 How to Run
Serve with VS Code **Live Server** (`http://localhost:5501/Day-01/03-blog-layout/index.html`) or open `index.html` directly in any modern browser.
