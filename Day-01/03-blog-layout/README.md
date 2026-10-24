# Project 03: Mobile-First Responsive Blog Layout

A responsive engineering blog layout built strictly using a **Mobile-First methodology** and semantic HTML5 as part of **Day 1: HTML5, CSS3 & Responsive Design Training** at Linkific.

---

## 🌟 Key Features
- **Mobile-First CSS Architecture**:
  - Base rules are written for mobile screens without media queries.
  - Progressively enhanced using `@media (min-width: 768px)` (tablet) and `@media (min-width: 1024px)` (desktop).
- **Semantic HTML5 Landmark Outline**:
  - Masthead in `<header class="blog-header">` with scrollable pill categories.
  - Primary content in `<main class="blog-feed">` containing featured and secondary `<article>` elements.
  - Sticky complementary sidebar in `<aside class="blog-sidebar">` containing author profile, newsletter form, and training status tracker.
  - Semantic `<footer>` with copyright and cross-project navigation.
- **2-Column Desktop Grid with Sticky Aside**:
  - On viewports `>= 1024px`, the layout shifts to `grid-template-columns: 1fr 340px`.
  - The sidebar uses `position: sticky; top: 2rem;` ensuring author information and training widgets remain in view while scrolling through longform content.

---

## 📐 Mobile-First Breakpoints Tested
| Viewport | Layout Strategy | Behavior |
| :--- | :--- | :--- |
| **Mobile (`< 768px`)** | Single Column Stack | Full width, scrollable category tabs, stacked newsletter form |
| **Tablet (`768px`)** | 2-Col Post Grid | Expanded header, side-by-side recent articles, horizontal newsletter form |
| **Desktop (`1024px+`)** | 2-Column Split Grid | Main article stream (1fr) + Sticky Sidebar (340px) |

---

## 💡 Key Learnings & Takeaways
1. **The Mobile-First Mindset**: Writing `@media (min-width: ...)` forces you to keep base CSS lean and performant for constrained mobile devices, only layering complexity when screen real estate permits.
2. **Sticky Positioning Prerequisites**: `position: sticky` requires the parent container to not have `overflow: hidden`, and the grid container must have `align-items: start` rather than the default `stretch`.
3. **Accessibility Landmarks**: Using `<main>`, `<article>`, and `<aside>` enables assistive screen readers to announce landmarks and jump directly to primary content.

---

## 🚀 How to Run Locally
Open `index.html` using the VS Code **Live Server** extension (`Go Live` in status bar) or directly in any modern browser.
