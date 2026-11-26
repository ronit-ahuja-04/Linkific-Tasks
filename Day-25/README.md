# Day 25 — SkillForge LMS (Project Planning, Architecture & Setup)

**Programme:** Linkific Internship — Month 1 Capstone (Days 25–30)  
**Project:** **SkillForge LMS** (Learning Management System)  
**Stack:** React 19 · Vite 8 · TypeScript 5.9 (strict) · Tailwind CSS v4 · Redux Toolkit · React Router v7 · Recharts · Supabase (Postgres, Auth, RLS, Storage, RPC)

---

## 1. Day 25 Deliverables Index

| Deliverable | Path |
| --- | --- |
| Project Proposal (features, roles, pages, APIs, integrations) | [docs/PROJECT_PROPOSAL.md](docs/PROJECT_PROPOSAL.md) |
| Tech Stack Decision Document | [docs/TECH_STACK_DECISION.md](docs/TECH_STACK_DECISION.md) |
| Architecture, Component Tree, State Flow, API Plan & ERD | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Screen Wireframes & Mockups (Desktop & Mobile) | [docs/WIREFRAMES.md](docs/WIREFRAMES.md) |
| Team Collaboration, Git Workflow, Standup & GitHub Board Guide | [docs/TEAM_WORKFLOW.md](docs/TEAM_WORKFLOW.md) |
| 6-Day Task Breakdown, Estimates & Milestones | [docs/TASK_BREAKDOWN.md](docs/TASK_BREAKDOWN.md) |
| BMAD v6.12.4 Artifacts (`brief`, `prd`, `DESIGN`, `EXPERIENCE`, `ARCHITECTURE-SPINE`, `epics`, `sprint-status`) | [_bmad-output/](_bmad-output/) |
| Agent Project Context | [AGENTS.md](AGENTS.md) |
| Initialized Application & Supabase Schema | [skillforge-lms/](skillforge-lms/) |

---

## 2. Day 25 Task Coverage Matrix

| Day 25 Brief Requirement | Status | Evidence |
| --- | --- | --- |
| Choose capstone project & brainstorm scope | Done | Selected **D. Learning Management System** ([PROJECT_PROPOSAL.md](docs/PROJECT_PROPOSAL.md)) |
| Define requirements (must-have vs nice-to-have, roles, pages, APIs, integrations) | Done | [PROJECT_PROPOSAL.md](docs/PROJECT_PROPOSAL.md) & [prd.md](_bmad-output/planning-artifacts/prds/prd-Day-25-2026-11-26/prd.md) |
| Design architecture & document stack decisions | Done | [TECH_STACK_DECISION.md](docs/TECH_STACK_DECISION.md) & [ARCHITECTURE-SPINE.md](_bmad-output/planning-artifacts/architecture/architecture-Day-25-2026-11-26/ARCHITECTURE-SPINE.md) |
| Technical diagrams (Component tree, State flow, API plan, DB schema) | Done | [ARCHITECTURE.md](docs/ARCHITECTURE.md) & [20261126000001_initial_schema.sql](skillforge-lms/supabase/migrations/20261126000001_initial_schema.sql) |
| Wireframes / UX specs | Done | [WIREFRAMES.md](docs/WIREFRAMES.md), [DESIGN.md](_bmad-output/planning-artifacts/ux-designs/ux-Day-25-2026-11-26/DESIGN.md), [EXPERIENCE.md](_bmad-output/planning-artifacts/ux-designs/ux-Day-25-2026-11-26/EXPERIENCE.md) |
| Team workflow, Git workflow, Roles, Code review & Standup schedule | Done | [TEAM_WORKFLOW.md](docs/TEAM_WORKFLOW.md) |
| Task breakdown, estimates & milestones (Days 25–30) | Done | [TASK_BREAKDOWN.md](docs/TASK_BREAKDOWN.md), [epics.md](_bmad-output/planning-artifacts/epics.md), [sprint-status.yaml](_bmad-output/implementation-artifacts/sprint-status.yaml) |
| Development environment initialized (Vite, deps, lint/format, env, folders) | Done | [skillforge-lms/package.json](skillforge-lms/package.json) |
| README with project overview | Done | This file & [skillforge-lms/README.md](skillforge-lms/README.md) |

---

## 3. Quick Start (`skillforge-lms`)

```bash
cd Day-25/skillforge-lms
npm install
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

To run with local Supabase (requires Docker running):

```bash
npm run db:start
npm run env:local
npm run db:reset
npm run dev
```

*(Open `http://localhost:5178` in your browser.)*
