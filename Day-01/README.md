# Day 1: HTML5, CSS3 & Responsive Design Basics

**Linkific Training Program • Days 1–3: Introductory Phase**  
**Trainee:** Ronit Ahuja  
**Date:** October 24, 2026  
**Methodology:** BMAD Framework  
**Scope & Constraints:** HTML5 & CSS3  
**Status:** ✅ Complete (4/4 Milestones Delivered & Verified)  

---

## 🎯 Learning Objectives & Accomplishments

| Objective | Status | Implementation Details |
| :--- | :---: | :--- |
| **HTML5 Semantic Elements** | ✅ | Implemented `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>` across all 4 projects. |
| **Accessibility (a11y)** | ✅ | Keyboard skip-links, ARIA landmarks, `aria-label` attributes, and logical `h1`–`h6` heading hierarchies. |
| **CSS Fundamentals & Box Model** | ✅ | Universal `box-sizing: border-box`, custom properties (CSS design tokens), hairline borders, and modern pseudo-classes. |
| **Flexbox Architecture** | ✅ | 1D layouts using `justify-content`, `align-items`, `flex-direction`, `flex-wrap`, and pure CSS mobile navigation drawer. |
| **CSS Grid 2D Layouts** | ✅ | Responsive multi-column grid layouts with fluid auto-placement (`repeat(auto-fit, minmax(300px, 1fr))`). |
| **Mobile-First Principles** | ✅ | Progressive enhancement using `min-width` media queries (Mobile `< 768px` → Tablet `768px` → Desktop `1024px+`). |
| **Pure CSS Interactivity** | ✅ | Checkbox hack navigation drawer, radio button category filter system (`:checked ~ .projects-grid`), and smooth scrolling. |
| **Authentic Reverse-Engineering** | ✅ | Reverse-engineered live portfolio ([ronit-ahuja-portfolio.vercel.app](https://ronit-ahuja-portfolio.vercel.app/)) using real assets, real projects, real resume, and authentic case studies. |
| **Fixed Resume Download Button** | ✅ | Fixed floating bottom-right frosted glass download button linking to real PDF resume ([Ronit_Ahuja_Resume.pdf](./assets/docs/Ronit_Ahuja_Resume.pdf)). |

---

## 📦 Compounding Project Progression (The BMAD Architecture)

Rather than building isolated, disconnected toy projects with fake placeholder text, the 4 deliverables were engineered as a **linear compounding build** of Ronit Ahuja's real engineering portfolio:

```text
Day-01/
├── assets/                  # Global Assets Directory (Shared across all milestones)
│   ├── docs/
│   │   └── Ronit_Ahuja_Resume.pdf
│   └── images/
│       ├── avatar.jpg
│       └── favicon.jpg
│
├── 01-responsive-nav/       # Foundation: Frosted Glass Nav, Brand Logo, Real Favicon, Hero & About Me
├── 02-card-grid/            # Superset: Stage 1 + 2D CSS Grid Projects Showcase & Pure CSS Filtering
├── 03-blog-layout/          # Superset: Stages 1 & 2 + Mobile-First Case Studies & Sticky Aside Sidebar
├── 04-portfolio/            # Capstone Master: Unified Portfolio + Dual-Column Resume & Pure HTML5 Contact Form
└── PRD.md                   # Product Requirements Document & QA Matrix
```

### 1. [01-responsive-nav](./01-responsive-nav/)
- **Core Focus**: Flexbox 1D layout, Apple frosted glass sticky header (`backdrop-filter: blur`), circular brand logo image (`avatar.jpg`), real favicon (`favicon.jpg`), and pure CSS checkbox hamburger drawer (`:checked`).
- **Authentic Content**: Real Hero section with status pill ("Full Stack Developer • Mumbai, India"), About Me narrative, 4-card services matrix ("What I'm Doing"), and official Font Awesome vector icons for GitHub, GitLab (5 origami facets), LinkedIn (`fa-linkedin-in`), and X.
- **Navigation**: In-page smooth scroll navigation (`#about`, `#contact`).

### 2. [02-card-grid](./02-card-grid/)
- **Core Focus**: Cumulative superset retaining Stage 1 foundation while introducing a 2-Dimensional CSS Grid Featured Projects Showcase.
- **Pure CSS Filter**: Integrated radio button category filtering (`#filter-all`, `#filter-web`, `#filter-mobile`, `#filter-ai`) using `:checked` and `:not()` pseudo-classes.
- **5 Real Production Projects**:
  1. *VESIT AMS* (Web & AI Attendance Management) — [Live Demo](https://vesit-ams.vercel.app/)
  2. *Kingstar Enterprises* (B2B E-Commerce Platform) — [Live Demo](https://kingstar-wardrobes.netlify.app/)
  3. *Budgetify* (Personal Expense Tracking Mobile App) — [GitLab (APK & Source)](https://gitlab.com/ahuja.ronit.0510/budgetify)
  4. *Menti Math* (Mental Arithmetic Mobile App in Flutter) — [GitLab (APK & Source)](https://gitlab.com/ahuja.ronit.0510/menti-math)
  5. *FlowLane* (Agile Workflow & Productivity SaaS) — [Live Demo](https://flow-lane.vercel.app/)
- **Navigation**: In-page smooth scroll navigation (`#about`, `#portfolio`, `#contact`).

### 3. [03-blog-layout](./03-blog-layout/)
- **Core Focus**: Cumulative superset retaining Stages 1 & 2 while introducing a Mobile-First long-form Technical Case Studies Feed and Sticky Aside Sidebar.
- **Layout Architecture**: Mobile-first single column base (`< 768px`) progressively enhanced to a 2-column asymmetric desktop layout (`grid-template-columns: 1fr 340px; align-items: start;`) with a sticky sidebar (`position: sticky; top: calc(var(--header-height) + 24px)`).
- **Authentic Case Studies**:
  1. *Engineering VESIT AMS: Multi-Tenant Attendance Management with Automated Session Tracking* (Featured article with architecture highlights)
  2. *Architecting B2B Catalog Discovery & Order Workflows for Kingstar Enterprises*
  3. *The BMAD Method: Transforming AI Assistance into Structured Agile Engineering*
- **Sticky Aside Widgets**: Author credentials, Core Competencies meters, Education timeline, and quick contact.
- **Navigation**: In-page smooth scroll navigation (`#about`, `#portfolio`, `#blog`, `#contact`).

### 4. [04-portfolio](./04-portfolio/)
- **Core Focus**: The grand capstone synthesizing all techniques into a unified, production-ready master portfolio for Ronit Ahuja.
- **Comprehensive Sections**:
  - Apple Frosted Header with avatar logo, favicon, in-page smooth-scroll navigation (`#about`, `#portfolio`, `#blog`, `#resume`, `#contact`), and pure CSS checkbox drawer.
  - Authentic Hero Section with live status badge, circular portrait, and crisp vector social icons.
  - About Me & "What I'm Doing" 4-Card Services Grid.
  - Featured Projects Showcase 2D CSS Grid with pure CSS category filter tabs.
  - Technical Case Studies & Engineering Notes Feed.
  - **Resume Section (`#resume`)**: Dual-column responsive split featuring:
    - *Education & Experience Timelines*: Linkific Trainee, VESIT AMS Lead, Kingstar Developer, VESIT Mumbai (B.E. IT), Hill Spring International, B K Birla Public School.
    - *Core Competencies & Skills*: Progress meters with percentage indicators (Frontend 85%, Backend 75%, Databases 80%, Mobile 75%, AI 70%, BMAD 90%) and categorized framework pills.
  - **Contact Section (`#contact`)**: Direct contact cards (Email, Phone, Location, Profiles) and a pure HTML5 contact form with floating labels and native input validation.
  - **Fixed Floating Resume Button**: Bottom-right frosted glass download button with scale hover animation, faithfully reverse-engineered from Ronit's live website.
  - **Active Scroll Spy**: Seamless real-time navbar tracker highlighting whichever section is in view.
  - Semantic Footer with complete site map navigation.

---

## 📸 Viewport Testing & Verification Checklist

- [x] **Mobile (< 768px - iPhone SE, iPhone 14 Pro)**: Pure CSS checkbox drawer slides down smoothly, single-column natural vertical flow, touch targets `>= 44px`, zero horizontal scroll.
- [x] **Tablet (768px - iPad, iPad Air)**: Responsive 2-column services, 2-column project cards, 2-column contact form rows, fluid typography.
- [x] **Desktop (1024px+ - Standard & High-DPI Monitors)**: Sticky frosted glass header, 4-column services grid, 3-column project showcase grid, 2-column asymmetric resume layout (`1.15fr 0.85fr`), subtle hover micro-interactions.
- [x] **Accessibility**: In-page skip links, keyboard navigation focus rings (`:focus-visible`), ARIA landmarks (`aria-label`), and semantic tag hierarchy.
- [x] **Asset Integrity**: Verified circular brand logo and real favicon render sharply at 1x and 2x DPR across all 4 projects.

---

## 📄 Architectural Specification

For the complete architectural design, target personas, non-functional requirements, and QA test sign-off matrix, see:  
👉 **[Product Requirements Document (PRD)](./PRD.md)**

---

## 🚀 Running Any Project Locally

1. Start an HTTP server from the `Day-01/` directory or workspace root:
   ```bash
   npx serve .
   ```
2. Open any milestone in your browser:
   - Capstone Portfolio: `http://localhost:5501/Day-01/04-portfolio/index.html`
   - Blog Layout: `http://localhost:5501/Day-01/03-blog-layout/index.html`
   - Card Grid: `http://localhost:5501/Day-01/02-card-grid/index.html`
   - Responsive Nav: `http://localhost:5501/Day-01/01-responsive-nav/index.html`
