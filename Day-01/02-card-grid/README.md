# Project 02: Portfolio Projects Showcase (CSS Grid)

A responsive 2-dimensional project showcase grid built using **CSS Grid** (`repeat(auto-fit, minmax(300px, 1fr))`) and semantic HTML5 as **Stage 2** of Ronit Ahuja's portfolio build during **Day 1: HTML5, CSS3 & Responsive Design Training** at Linkific.

Built following the **BMAD Framework** (Breakthrough Method for Agile AI-Driven Development).

---

## 🌟 Real-World Data & Continuity
This project is not an isolated demo—it is **Stage 2** in the progressive build of Ronit Ahuja's portfolio, carrying forward the Apple frosted glass header from Project 1 and implementing the **Featured Projects Section** with 5 actual production projects:
1. **VESIT AMS** (*Hybrid*): AI-assisted attendance tracking, session tracking, and faculty dashboard.
2. **Kingstar Enterprises** (*Web*): B2B e-commerce platform with catalog filtering.
3. **Budgetify** (*Application*): Mobile financial management and budgeting application.
4. **Menti Math** (*Application*): Gamified mathematical problem-solving training app.
5. **FlowLane** (*Web*): Team workflow and milestone productivity automation tool.

---

## 📐 CSS Grid Architecture & Key Techniques

### 1. Fluid Auto-Wrapping (`auto-fit` + `minmax`)
```css
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
```
- **Why `auto-fit` instead of `auto-fill`?** `auto-fit` expands filled tracks to absorb extra container width, preventing empty phantom columns on wide displays.
- **Why `minmax(300px, 1fr)`?** Enforces a minimum legible card width of `300px` on compact screens while fluidly sharing leftover space proportionally using fractional units (`1fr`).

### 2. Internal Flexbox Alignment (Uneven Text Height Fix)
Real project descriptions have different lengths. To keep the card footers and CTA buttons strictly aligned:
```css
.project-card {
  display: flex;
  flex-direction: column;
}
.card-body {
  flex-grow: 1; /* Body stretches to absorb uneven text height */
}
.card-footer {
  margin-top: auto; /* Pins CTA button to the bottom evenly across all cards */
}
```

### 3. Pure CSS3 Selector Filtering (Zero JavaScript)
Using semantic `<input type="radio">` controls and the CSS general sibling combinator with `:checked` and `:not([data-category="..."])`, category tabs dynamically filter cards with zero JavaScript. This directly showcases mastery of Day 1's core objective: *Advanced CSS Selectors & Pseudo-classes*.

---

## 📱 Viewport Breakpoints Tested

| Viewport Tier | Width Range | Layout & Grid Behavior |
| :--- | :--- | :--- |
| **Desktop** | `≥ 1024px` | 3-column fluid grid; hover elevation (`transform: translateY(-4px)`); full horizontal navigation. |
| **Tablet** | `640px – 1023px` | 2-column balanced grid; compact navigation links. |
| **Mobile** | `< 640px` | 1-column single stack; 48px header with 2-line toggle; mobile sheet overlay. |

---

## 🚀 How to Run Locally
Open [`index.html`](./index.html) using the VS Code **Live Server** extension (`Go Live` in status bar) or directly in any modern browser.
