# Inspiration (GG Executive OS - Client-Only)

Client-side version of the Grain & Grit Executive OS. A fully browser-based executive dashboard for daily check-ins, prioritized task lists, weekly reviews, and AI-powered coaching. All data stored in localStorage — no backend required.

## Tech Stack

- **Frontend:** React 18 + Vite 4 + CSS custom properties (dark theme)
- **Icons:** Lucide React
- **AI:** Claude API (direct or via Cloudflare Worker CORS proxy)
- **Deployment:** GitHub Pages (auto-deploy via GitHub Actions on push to main/master)

## Quick Start

```bash
npm install
npm run dev          # Dev server at localhost:5173
npm run build        # Production build to dist/
npm run preview      # Preview production build locally
```

## Project Structure

```
src/
  main.jsx              # React 18 root render
  App.jsx               # Main app shell + navigation
  index.css             # Dark theme with CSS variables
  components/
    CheckIn.jsx         # Daily check-in (3-step wizard: scores → track actions → AI priorities)
    CommandCenter.jsx   # Dashboard (scorecard + priorities)
    WeeklyReview.jsx    # Weekly reflection (wins, adjustments, analytics)
    BycScorer.jsx       # Broken Yolk Café site evaluation tool
    Chat.jsx            # Claude AI assistant chat panel
  utils/
    store.js            # localStorage state management
    bycStore.js         # BYC scorer state management
    constants.js        # Categories, tracks, team, colors
    priorities.js       # Priority generation algorithm + delegation logic

worker/
  worker.js             # Cloudflare Worker CORS proxy for Claude API

.github/workflows/
  deploy.yml            # GitHub Pages deployment pipeline
```

## Key Conventions

- **State:** localStorage only — keys: `grain_grit_os`, `grain_grit_byc_scores`, `gg_api_key`, `gg_proxy_url`
- **Styling:** Inline CSS objects with CSS custom variables (--bg, --accent, --red, --amber, --green). No CSS-in-JS library.
- **Components:** Functional React with hooks. Single-file components.
- **Naming:** camelCase functions/variables, PascalCase components.
- **No TypeScript, no testing framework.**

## Configuration

No .env file needed. Runtime config via Chat settings modal (stored in localStorage):
- `gg_api_key` — Claude API key (direct browser calls)
- `gg_proxy_url` — Cloudflare Worker URL (alternative to direct API)

Hardcoded:
- Vite base path: `/Inspiration/` (GitHub Pages subpath)
- Claude model: `claude-sonnet-4-20250514`
- Dev server: `0.0.0.0:5173`

## Domain Context

- **Scoring:** 1-5 RED, 6-7 AMBER, 8-10 GREEN
- **4 Tracks:** Personal OS, Real Estate, AI/Automation, Riptide Baseball
- **Priority Levels:** P1, P2, P3 (max 5 items)
- **Delegation:** Keyword matching in task text → team member suggestion (rules in `priorities.js`)
- **Check-In Flow:** Score 9 categories → Define track actions → AI generates prioritized list → Execute from Command Center
- **Weekly Review:** Aggregates week's check-ins, capture 3 wins + 1 adjustment
