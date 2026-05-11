# CPM — Cyber Portfolio Management Tool

Front-end for the **Cyber Portfolio Management** workflow. The application is
organised as a sequence of pages that follow an initiative end-to-end:

| #  | Page                  | Purpose                                                  |
|----|-----------------------|----------------------------------------------------------|
| 01 | Strategy & Initiation | Capture a new initiative before formal project creation  |
| 02 | RFP & Procurement     | Draft and run procurement                                |
| 03 | Contracting & Award   | Lock budget, milestones, and risk register               |
| 04 | Weekly Execution      | Track delivery cadence                                   |
| 05 | QA Workflow           | Quality review of deliverables                           |
| 06 | CISO Dashboard        | Portfolio-level view for the CISO                        |

This PR delivers **Page 01 — Strategy & Initiation (v02)**.

## Stack

- [Vite](https://vitejs.dev/) + React 18 (JSX, no TypeScript)
- No CSS framework — inline styles using the CPM brand token palette defined
  in the component itself

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints (defaults to <http://localhost:5173>).

## Build

```bash
npm run build
npm run preview
```

## Deployment (GitHub Pages)

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds the
app and publishes `dist/` to GitHub Pages. The deployed site lives at
<https://lsboutros.github.io/CPM/>.

The Vite `base` is set to `/CPM/` in `vite.config.js` so asset URLs
resolve correctly under the repo sub-path. If you fork or rename the
repository, update that value to match.

One-time GitHub setup (already done if the workflow has run successfully):
**Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Page 01 sections

Strategy & Initiation walks the Domain Lead through seven sections:

1. Project Identity
2. Strategic Vision
3. Scope & Milestones
4. Prioritization (weighted scoring across six criteria)
5. Budget & Timeline
6. Dependencies
7. Submit (with summary + approval workflow)

The priority score is calculated live from the answers given in the
Prioritization section using the weights defined in `src/CPMPage01.jsx`.
