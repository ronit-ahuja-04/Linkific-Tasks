# Project 04: Capstone Personal Portfolio

The grand culmination of **Day 1: HTML5, CSS3 & Responsive Design Training** at Linkific — a production-grade, single-page personal portfolio for **Ronit Ahuja**, completely reverse-engineered from his live portfolio ([ronit-ahuja-portfolio.vercel.app](https://ronit-ahuja-portfolio.vercel.app/)) adhering to the **BMAD Method** and **HTML5 & CSS3**.

---

## 🏛️ Architecture & Unified Superset Model

Project 04 is the final milestone in Day 1's linear, compounding progression:
- **Project 01 (`01-responsive-nav`)**: Established the Apple Frosted Glass navigation, brand identity, real circular avatar logo, favicon, and hero foundation.
- **Project 02 (`02-card-grid`)**: Introduced the 2D CSS Grid Featured Projects Showcase (5 real projects) with pure CSS `:checked` radio filtering.
- **Project 03 (`03-blog-layout`)**: Introduced the mobile-first Engineering Notes / Case Studies feed and sticky aside credentials sidebar.
- **Project 04 (`04-portfolio`)**: Unifies all prior components into a master personal portfolio, adding a comprehensive **Dual-Column Resume Section** (Experience & Education Timelines + Technical Skills Progress Meters) and a **Semantic Contact Section** (Direct Details + Pure HTML5 Form).

---

## 🌟 Key Sections & Technical Features

### 1. Apple Frosted Navigation & Header
- **Circular Brand Avatar & Favicon**: Uses real assets from the global directory (`../assets/images/avatar.jpg` and `../assets/images/favicon.jpg`).
- **In-Page Anchor Smooth Scrolling**: Clean in-page anchors (`#about`, `#portfolio`, `#blog`, `#resume`, `#contact`) with CSS `scroll-behavior: smooth` and `scroll-padding-top`.
- **Pure CSS Mobile Drawer (Checkbox Hack)**:
  - Uses hidden `#nav-toggle-input` and `<label for="nav-toggle-input">`.
  - Pure CSS selector: `#nav-toggle-input:checked ~ .primary-nav { display: flex; }`.
  - Hamburger bars smoothly cross into an 'X' icon via CSS3 transforms with zero JavaScript.
- **Stripe-Style Pill CTA**: External link to Ronit's live Vercel portfolio with hover arrow translation.

### 2. Authentic Hero Section
- **Live Status Indicator**: Green pulsating status pill ("Full Stack Developer • Mumbai, India • Linkific Trainee").
- **Real Portrait Avatar**: Circular 80px avatar with hairline border and depth shadow.
- **Authentic Copy**: Accurate bio highlighting IT Engineering studies at VESIT Mumbai.
- **Official Brand Vector Icons**:
  - **GitHub**: Solid vector glyph (`viewBox="0 0 512 512"`).
  - **GitLab**: High-precision 5-facet origami vector (`viewBox="0 0 512 512"`), eliminating sub-pixel raster blur.
  - **LinkedIn**: Crisp unboxed `in` lettermark glyph (`viewBox="0 0 448 512"`).
  - **Twitter / X**: Clean vector mark (`viewBox="0 0 512 512"`).

### 3. About Me & "What I'm Doing"
- Full narrative covering software development, cross-platform apps, and engineering philosophy.
- Core Focus pill badges (Software Development, Flutter, React, Firebase, UI/UX Design, BMAD SDLC).
- 4-Card Services Grid with subtle card lift (`transform: translateY(-2px)`):
  - 📱 Mobile Apps
  - 💻 Web Development
  - ⚡ AI-Assisted Dev
  - 📐 SDLC & BMAD

### 4. Featured Projects Showcase (2D CSS Grid + Pure CSS Filter)
- Displays Ronit's 5 real software projects:
  1. **VESIT AMS**: [Live Demo](https://vesit-ams.vercel.app/) • [GitHub Repo](https://github.com/ronit-ahuja-04/qrAttendanceApp) — Smart AI-assisted Attendance Management System.
  2. **Kingstar Enterprises**: [Live Demo](https://kingstar-wardrobes.netlify.app/) • [GitLab Repo](https://gitlab.com/ahuja.ronit.0510/kingstar) — B2B e-commerce platform with product catalogs.
  3. **Budgetify**: [GitLab Repo (APK & Source)](https://gitlab.com/ahuja.ronit.0510/budgetify) — Personal finance and expense tracking mobile application (Flutter).
  4. **Menti Math**: [GitLab Repo (APK & Source)](https://gitlab.com/ahuja.ronit.0510/menti-math) — Gamified mental arithmetic quiz app with global leaderboards (Flutter).
  5. **FlowLane**: [Live Demo](https://flow-lane.vercel.app/) • [GitLab Repo](https://gitlab.com/ahuja.ronit.0510/flowlane) — Agile workflow and task coordination concept.
- **Pure CSS Filter Tabs**: Uses hidden radio inputs (`#filter-all`, `#filter-web`, `#filter-mobile`, `#filter-ai`) and the sibling selector (`~`) to toggle visibility without JavaScript:
  ```css
  #filter-web:checked ~ .projects-grid .project-card:not([data-category~="web"]) {
    display: none;
  }
  ```

### 5. Technical Case Studies & Engineering Notes (`#blog`)
- 3 authentic long-form technical case studies:
  - *Engineering VESIT AMS: Multi-Tenant Attendance Management with Automated Session Tracking* (Redirects to [GitHub README](https://github.com/ronit-ahuja-04/qrAttendanceApp#readme)).
  - *Architecting B2B Catalog Discovery & Order Workflows for Kingstar Enterprises* (Redirects to [GitLab README](https://gitlab.com/ahuja.ronit.0510/kingstar#readme)).
  - *The BMAD Method: Transforming AI Assistance into Structured Agile Engineering* (Redirects to [Official BMAD Documentation](https://github.com/bmad-code-org/BMAD-METHOD#readme)).

### 6. Resume: Education & Skills Section (`#resume`)
- **Dual-Column Responsive Grid**:
  - **Left Column: Timelines**:
    - *Practical Experience*: Linkific Trainee, VESIT AMS Project Lead, Kingstar Enterprises Full Stack Developer.
    - *Education*: VESIT Mumbai (B.E. IT), Hill Spring International (HSC PCM), B K Birla Public School (CBSE).
  - **Right Column: Competencies & Skills**:
    - Progress meters with percentage displays: Frontend (85%), Backend & APIs (75%), Databases & Cloud (80%), Mobile Apps (75%), AI & Prompting (70%), BMAD SDLC (90%).
    - Categorized sub-pills highlighting modern frameworks and tooling.
    - Full resume download / external showcase action card linking directly to `../assets/docs/Ronit_Ahuja_Resume.pdf`.
- **Fixed Floating Resume Button**: Bottom-right circular frosted glass download button (`.download-btn-fixed`) reverse-engineered from Ronit's actual portfolio, enabling instant 1-click PDF resume download from any scroll position.

### 7. Contact Section (`#contact`) & Semantic Footer
- **Contact Details**: Direct mailto link, phone link, location, and quick online profile chips.
- **Pure HTML5 Contact Form**:
  - Semantic `<label>` and `<input>` associations.
  - Native browser validation (`required`, `type="email"`).
  - Form action configured to direct mail handling without requiring JavaScript execution.
- **Semantic Footer**: Full site navigation links, social profile links, and Day 1 metadata badges.

---

## 📐 Responsive Breakpoint Matrix

| Viewport | Header / Navigation | Layout & Grid Behavior |
| :--- | :--- | :--- |
| **Mobile (`< 768px`)** | Checkbox hamburger toggle with frosted slide-down drawer | Single-column natural vertical stack for all sections, full-width cards, optimized touch targets |
| **Tablet (`768px - 1023px`)** | Desktop inline navigation bar, hidden toggle | 2-column services grid, 2-column project cards, 2-column form rows, responsive footers |
| **Desktop (`1024px+`)** | Sticky frosted header with glassmorphism blur | 4-column services grid, 3-column project cards grid, 2-column asymmetric resume grid (`1.15fr 0.85fr`), 2-column contact grid |

---

## 💡 Key BMAD Takeaways
1. **Zero JavaScript Discipline**: Modern CSS3 pseudo-classes (`:checked`, `:not()`, `~`, `:focus-visible`) and native HTML5 elements provide full interactive capability without the overhead, bundle size, or hydration delay of JavaScript.
2. **Reverse-Engineering Authentic Data**: Grounding training deliverables in real projects, real metrics, and real career trajectories transforms practice exercises into a genuine, production-grade professional asset.
3. **Compounding Development Model**: Building modular foundations (Nav → Grid → Blog → Capstone) ensures each stage validates the previous one and eliminates technical debt.

---

## 🚀 How to Run Locally
1. Start an HTTP server from the workspace root or directory:
   ```bash
   npx serve .
   ```
2. Open `http://localhost:5501/Day-01/04-portfolio/` in your modern web browser.
