# Product Requirements Document (PRD)

## Day 1: HTML5, CSS3 & Responsive Design Fundamentals

| Metadata | Details |
| :--- | :--- |
| **Document Version** | 1.0.0 |
| **Author / Trainee** | Ronit Ahuja |
| **Organization** | Linkific Technology |
| **Program** | Engineering Training Program (Days 1–3: Introductory Phase) |
| **Track** | Frontend Engineering & Semantic Web Architecture |
| **Methodology** | BMAD Framework (Breakthrough Method for Agile AI-Driven Development) |
| **Execution Date** | October 24, 2026 |
| **Deliverable Status** | ✅ Completed & Verified (4/4 Milestones Delivered) |

---

## 1. Executive Summary & Purpose

The objective of Day 1 training at Linkific is to build a rock-solid foundation in modern **HTML5 semantic architecture**, **CSS3 layout engines (Flexbox & CSS Grid)**, and **mobile-first responsive design**. 

Rather than creating disconnected, synthetic toy exercises with fake placeholder text, this project executes an authentic **reverse-engineering** of Ronit Ahuja's production portfolio ([ronit-ahuja-portfolio.vercel.app](https://ronit-ahuja-portfolio.vercel.app/)). The four required training deliverables form a **linear, compounding build** where each subsequent project acts as a functional superset of the previous one, culminating in an integrated, production-ready master portfolio.

---

## 2. Core Constraints & Guiding Principles

1. **Zero JavaScript Baseline**: Day 1 curriculum strictly mandates mastering pure HTML5 and CSS3. Interactive elements (navigation drawer toggle, multi-category project filtering, card hover states) are achieved purely through modern CSS3 pseudo-classes (`:checked`, `:not()`, and sibling combinators `~`).
2. **Authentic Data (Zero AI Fluff)**: No placeholder Latin ("Lorem ipsum") or generic filler phrases. Every project card, bio summary, case study, educational milestone, and service reflects Ronit's real software work and academic trajectory at VESIT Mumbai.
3. **Apple Frosted Glass & Stripe Micro-Interactions**: Visual design adheres to Apple Human Interface Guidelines—frosted glass translucent navigation (`backdrop-filter: blur`), dark surface hierarchy, hairline borders (`1px solid rgba(255, 255, 255, 0.08)`), clean typography (`Inter`), and high-precision vector icons.
4. **Atomic Git Hygiene**: Strictly structured commits, zero committed OS artifacts (`.DS_Store` via `.gitignore`), and explicit verification gates before remote synchronization.

---

## 3. User Personas & Target Audiences

| Persona | Role | Primary Goal | Key Experience Expected |
| :--- | :--- | :--- | :--- |
| **Engineering Evaluator / Tech Lead** | Linkific Technical Reviewer | Assess architectural rigor, code cleanliness, semantic validity, and adherence to constraints. | Valid HTML5 landmarks, zero framework bloat, flawless CSS-driven states, responsive breakpoints. |
| **Hiring Manager / Recruiter** | Technical Talent Acquisition | Evaluate practical software experience, project depth, and technical competencies. | Immediate access to live project demos (VESIT AMS, Kingstar), GitHub repositories, and resume timeline. |
| **End-User / Client** | Prospective Collaborator | Browse services, review technical articles, and send an inquiry. | Instant page load, clear navigation, legible case studies, and a functional contact form. |

---

## 4. Compounding Milestone Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: 01-responsive-nav                                            │
│ Foundation: Apple Frosted Header, Brand Logo, Favicon, Hero, About Me  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Superset Inheritance)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: 02-card-grid                                                  │
│ Stage 1 Foundation + 2D CSS Grid Featured Projects Showcase (5 Items)  │
│ Pure CSS Radio Button Category Filtering (:checked pseudo-class)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Superset Inheritance)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE 3: 03-blog-layout                                                │
│ Stages 1 & 2 + Mobile-First Case Studies Feed & Sticky Credentials     │
│ Asymmetric 2-Column Desktop Split (1fr 340px) with Sticky <aside>     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Superset Synthesis)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE 4: 04-portfolio (Capstone Master)                                │
│ Unified Master Portfolio: Stages 1–3 + Dual-Column Resume Timelines   │
│ Technical Competency Meters + Pure HTML5 Direct Contact Form           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Functional Requirements by Milestone

### Milestone 1: Responsive Navigation & Foundation (`01-responsive-nav`)
- **FR-1.1**: Header must use semantic `<header class="site-header">` with `position: sticky; top: 0;` and Apple frosted blur (`backdrop-filter: blur(20px)`).
- **FR-1.2**: Brand identifier must display circular profile avatar (`28px × 28px`) and name linked to home.
- **FR-1.3**: Browser tab must render real portfolio favicon (`favicon.jpg`).
- **FR-1.4**: Mobile toggle must utilize the Pure CSS Checkbox Hack (`#nav-toggle-input:checked ~ .primary-nav`) with an animated 2-line hamburger morphing into an 'X' icon without JavaScript.
- **FR-1.5**: Hero section must present active status badge, 80px circular portrait, authentic headline, bio summary, CTAs, and official vector icons for GitHub, GitLab, LinkedIn, and X.
- **FR-1.6**: About Me section must render bio narrative and 4-card services matrix ("What I'm Doing").

### Milestone 2: Card Grid & Projects Showcase (`02-card-grid`)
- **FR-2.1**: Inherit all Milestone 1 components with in-page smooth-scrolling anchors (`#about`, `#portfolio`).
- **FR-2.2**: Projects showcase must utilize 2D CSS Grid: `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`.
- **FR-2.3**: Display Ronit's 5 real production projects:
  1. *VESIT AMS* (Web & AI Attendance Management)
  2. *Kingstar Enterprises* (B2B E-Commerce Platform)
  3. *Budgetify* (Personal Finance & Expense Tracker)
  4. *Menti Math* (Mental Arithmetic Flutter App)
  5. *FlowLane* (Agile Workflow Concept)
- **FR-2.4**: Pure CSS Category Filtering: Radio buttons (`#filter-all`, `#filter-web`, `#filter-mobile`, `#filter-ai`) controlling card visibility via `:checked ~ .projects-grid .project-card:not([data-category~="..."]) { display: none; }`.
- **FR-2.5**: Card footers must stay aligned at the bottom across variable content lengths using `margin-top: auto`.

### Milestone 3: Mobile-First Blog & Sticky Aside (`03-blog-layout`)
- **FR-3.1**: Inherit Milestones 1 & 2 foundations with in-page anchors (`#about`, `#portfolio`, `#blog`, `#contact`).
- **FR-3.2**: Authorship of CSS must adhere to strict **Mobile-First methodology**: single-column vertical flow written without media queries for `< 768px`, progressively enhanced for `768px` (tablet) and `1024px+` (desktop).
- **FR-3.3**: Desktop layout must render an asymmetric 2-column grid (`grid-template-columns: 1fr 340px; align-items: start; gap: 36px;`).
- **FR-3.4**: Longform feed (`<main class="writing-feed">`) must feature 3 authentic technical case studies:
  - *Engineering VESIT AMS: Multi-Tenant Attendance Management with Automated Session Tracking*
  - *Architecting B2B Catalog Discovery & Order Workflows for Kingstar Enterprises*
  - *The BMAD Method: Transforming AI Assistance into Structured Agile Engineering*
- **FR-3.5**: Sticky Sidebar (`<aside class="sticky-sidebar">`): Must lock at `top: calc(var(--header-height) + 24px)` while scrolling, rendering Author credentials, technical competencies meters, and academic history timeline.

### Milestone 4: Capstone Personal Portfolio (`04-portfolio`)
- **FR-4.1**: Grand synthesis of all sections into a unified single-page personal portfolio.
- **FR-4.2**: **Resume & Competencies Section (`#resume`)**:
  - *Experience Timeline*: Linkific Trainee, VESIT AMS Lead, Kingstar Developer.
  - *Education Timeline*: VESIT Mumbai (B.E. IT), Hill Spring International (HSC PCM), B K Birla Public School (CBSE).
  - *Skills Progress Breakdown*: Frontend (85%), Backend (75%), Databases (80%), Mobile (75%), AI (70%), BMAD (90%) with sub-pills and full resume download card.
- **FR-4.3**: **Contact Section (`#contact`)**:
  - Direct contact cards (Email, Phone, Location, Online profiles).
  - Pure HTML5 contact form with floating labels, required attributes, honeypot spam protection, and native form submission.
- **FR-4.4**: **Active Section Navbar Tracker**:
  - Real-time scroll spy highlighting the current section in view with a frosted pill and glowing electric blue indicator bar (`::after`).

---

## 6. Non-Functional Requirements (NFRs)

### Performance & Optimization
- **NFR-P1**: Zero third-party JavaScript bundles (React, jQuery, Bootstrap, or Tailwind runtime).
- **NFR-P2**: Google Fonts preconnected (`preconnect`) with `font-display: swap`.
- **NFR-P3**: Local image assets compressed and cached; SVG icons embedded inline to eliminate additional HTTP network requests.
- **NFR-P4**: Page load speed achieves 95+ score on Google Lighthouse across Desktop and Mobile.

### Responsive Breakpoints & Cross-Device Matrix
- **NFR-R1**: **Mobile (< 768px)**: 100% single-column layout, touch target heights `>= 44px`, zero horizontal scrolling (`overflow-x: hidden`).
- **NFR-R2**: **Tablet (768px - 1023px)**: 2-column grid flows, expanded readable line lengths, comfortable gutter margins (`20px - 28px`).
- **NFR-R3**: **Desktop (1024px - 1440px+)**: Sticky frosted navigation, 3-column project showcase, 2-column asymmetric resume and contact sections, maximum container width capped at `1140px`.

### Accessibility & Standards (WCAG 2.1 AA)
- **NFR-A1**: Keyboard accessibility: Accessible skip-to-content link (`.skip-link`) visible on tab focus.
- **NFR-A2**: High contrast ratio (`>= 4.5:1`) for body text (`#f4f4f5` and `#a1a1aa` against `#0a0a0c`).
- **NFR-A3**: Focus indicators: Visible 2px outline on interactive elements (`:focus-visible`).
- **NFR-A4**: Proper document heading hierarchy: Exactly one `<h1>` per page, followed by logical `<h2>`, `<h3>`, `<h4>` nesting.

---

## 7. Quality Assurance & Verification Sign-Off

| Test Category | Test Case | Target Result | Observed Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Mobile Drawer** | Tap hamburger toggle on mobile viewport | Smooth slide-down menu; bars transform to 'X' | Drawer slides down instantly without lag | ✅ Pass |
| **Project Filter** | Select "Mobile" or "Web" filter tabs | Only matching project cards displayed | Cards filter instantly via CSS `:checked` | ✅ Pass |
| **Scroll Spy** | Scroll down to Blog, Resume, Contact | Matching nav link receives active pill & glow | Single active highlight moves cleanly | ✅ Pass |
| **Anchor Links** | Click any navbar link | Smoothly scrolls to target section | Smooth scroll lands with header offset | ✅ Pass |
| **Contact Form** | Submit empty form | Browser blocks submit with validation tooltip | Native HTML5 tooltip displayed | ✅ Pass |
| **Vector Icons** | Inspect GitLab / LinkedIn icons at 2x DPR | Crisp rendering with zero pixel blur | Vector paths render perfectly sharp | ✅ Pass |
| **Git Cleanliness** | Check `git status` | Zero `.DS_Store` or unapproved files | Clean working tree with `.gitignore` | ✅ Pass |

---

## 8. Date & Sign-Off

- **Frontend Developer Intern**: Ronit Ahuja  
- **Date**: October 24, 2026  
