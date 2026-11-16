# Garden-Bot (Dedrab) — Project Context

> Living document. Any AI model/session should read this file first and
> update it after meaningful work. See `.clinerules` for the update rules.
> This is the LIVE repo (git, branch tracked below) — distinct from the
> `Garden-Bot` staging/notes folder under `Documents/Claude/Projects/`,
> which is not a git repo and not deployed.

## Project Overview

- **Repo path**: `~/Projects/garden-bot/`
- **Current branch**: `feature/staged-pipeline` (tracking `origin/feature/staged-pipeline`)
- **Stack**: Next.js (App Router, React), TypeScript, Tailwind, Supabase
  (Postgres + RLS), Stripe, Resend (email), Inngest (background jobs/staged
  pipeline), Leaflet/react-leaflet (maps), `@google/genai` (Gemini —
  analysis + image generation), `@react-pdf/renderer` (PDF export).
- **Key directories**:
  - `src/app` — routes/pages + API routes (`/api/analyse`, `/api/redesign`, etc.)
  - `src/inngest/functions` — staged pipeline jobs (`pipeline.ts`, `garden-render.ts`)
  - `src/lib` — shared logic/clients (e.g. `src/lib/planting/generate.ts`)
  - `src/components` — shared UI
  - `supabase/migrations` — source-controlled DB schema/RLS
- **Env/config**: `.env.local` (gitignored, real secrets) + `.env.local.example`
  (template, safe to commit). Key var names actually used in code:
  `GOOGLE_API_KEY` (Gemini — NOT `GEMINI_API_KEY`, that name only appears in
  CI placeholder config), `RESEND_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, `NEXT_PUBLIC_PAYMENTS_ENABLED`,
  `DESIGN_TOOL_LIVE`.

## Current State (as of 2026-11-16)

- On `feature/staged-pipeline` branch, actively mid-build on the staged
  design pipeline (stages 1–7 shipped per commit history: planting engine,
  Inngest jobs, `/lab/plan` page, PDF generation, gap fixes for rate
  limits/UUID validation/signed links, light/spacing validation, garden
  render, staged statuses).
- Recent commits: plant table work (132 plants tagged/verified, 10 garden
  styles, dropped invasive-listed plants), photo upload + email capture.
- `GOOGLE_API_KEY` (Gemini) was just rotated — old key deleted on Google's
  side, billing enabled on the Google Cloud project, new key verified
  working via live API call (see Recent Changes below).
- One untracked file present locally: `test-image-gen.mjs` (ad-hoc test
  script, not committed).
- **Live site (`main`)**: security branch merged and deployed 16 Nov
  (open email relay closed, upload routes hardened, Next.js 16.4.6). The
  old design tool stays switched off (`DESIGN_TOOL_LIVE`), payments off.
- **Production database**: all six November migrations are applied
  (phase-0 lockdown, `plants`, `plan_jobs` + pdf_url + staged statuses +
  recipient_email). The app reads plants from `src/data/plants-fixture.json`
  (130 plants); the `plants` table is empty and not yet used.
- **Nothing on this branch has run end to end with live AI yet.** That is
  the next step.

## Active Work / Next Steps

- **NEXT: first real plan, run locally.** Preview deployments cannot run
  the new jobs: Inngest cloud calls the production app, and `main` does not
  contain `plan/start`, `plan-pdf/start` or `garden-render/start`, so a job
  created on a preview would sit at queued. Run locally instead:
  terminal 1 `INNGEST_DEV=1 npm run dev`, terminal 2
  `npx inngest-cli@latest dev -u http://localhost:3000/api/inngest`, then
  enter an invite code at `/next` and use `/lab/plan`. `LAB_ENABLED=true`
  is already in `.env.local`.
- Then: owner tests the corner-pin screen on 5 to 10 real garden photos
  (gate: outline looks right on 8 of 10).
- Before any merge of this branch to `main`: put the new Google key and
  `LAB_ENABLED` decisions into Vercel, and re-sync the Inngest app after
  deploy so the three new functions register.
- Full plan and gates: Claude doc "Dedrab Revised Strategy and Project
  Plan" (14 Nov 2026). Task detail: `BACKLOG.md`.

- Confirm dev server picks up the rotated key cleanly: run `npm run dev`
  and exercise `/api/analyse` or `/api/redesign` (or the `/lab/plan` staged
  flow) end-to-end.
- Decide whether to commit/clean up `test-image-gen.mjs` or delete it.
- Continue staged-pipeline work per `BACKLOG.md` in this repo (not yet
  reviewed in this session — check it for current priority order).
- Just set up this `PROJECT_CONTEXT.md` + `.clinerules` persistent-context
  system in the real repo (2026-11-16), mirroring the one mistakenly first
  created in the `Documents/Claude/Projects/Garden-Bot` staging folder.

## Recent Changes (newest first)

- **2026-11-16 (Cline)** — Confirmed with the owner that the rotated
  `GOOGLE_API_KEY` has been added to Vercel (Production and Preview) and
  the app redeployed. The "put new Google key into Vercel" item from
  `BACKLOG.md` is now done. Also ran a full secret-exposure audit on this
  repo: `.env*` is gitignored repo-wide, no secrets found anywhere in
  local or remote git history (all branches), GitHub repo
  (`flash41/garden-genie`) confirmed **public**, and all code
  (`list-models.js`, `vercel.json`, app routes, `test-image-gen.mjs`)
  reads keys only via `process.env`/`.env.local` — nothing hardcoded.
- **2026-11-16 (Claude, 15:10)** — Applied the last two migrations to
  production via Supabase (`plan_jobs_staged_statuses`,
  `plan_jobs_recipient_email`); the first three were already applied.
  Verified `plan_jobs` columns match what the code reads and writes; RLS on
  for `plan_jobs` and `plants`, no public policies. Checked the new Google
  key against Google's live model list: `gemini-2.5-flash` (text) is
  offered; the render default `gemini-2.0-flash-exp` is NOT, so changed the
  default in `src/inngest/functions/garden-render.ts` to
  `gemini-2.5-flash-image` (override with `GEMINI_IMAGE_MODEL`). Added
  `LAB_ENABLED=true` to `.env.local`. `npx tsc --noEmit` passes. Uncommitted:
  `garden-render.ts`, `BACKLOG.md`, this file.
- **2026-11-16 (Claude, morning)** — Security branch merged to `main` and
  verified live. Plant table rebuilt and verified against RHS pages (130
  plants), fixed list of ten garden styles (`src/lib/planting/styles.ts`),
  photo upload and email capture wired into `/api/plan/create`.

- **2026-11-16** — Rotated `GOOGLE_API_KEY` in `.env.local`: old key
  deleted on Google's side, billing enabled, new key pasted in by user.
  Verified live with a direct `@google/genai` `generateContent` call
  (`gemini-2.5-flash`) — returned successfully. No code changes needed;
  all app code already reads `process.env.GOOGLE_API_KEY` consistently
  (`src/app/api/analyse/route.ts`, `src/app/api/redesign/route.ts`,
  `src/inngest/functions/pipeline.ts`, `src/inngest/functions/garden-render.ts`,
  `src/lib/planting/generate.ts`). Dev server was not running at time of
  rotation — restart on next `npm run dev` picks up the new value.
- **2026-11-16** — Added `PROJECT_CONTEXT.md` and `.clinerules` to this
  (real) repo so project context persists across model/session switches.

## Known Issues / Open Questions

- Render prompt lists plants but not their positions; judge after the
  first real renders.
- Style tags and seasons on the plant table are proposals awaiting the
  owner's review (`plants-style-tags-review.md` in the Documents folder).
- Soil acidity is recorded per plant (`soil_ph`) but not asked of the user
  or checked; 11 plants need acid or neutral soil.
- Vercel Hobby plan is, as far as known, non-commercial only: check before
  payments are switched back on.
- GitHub check fails on `npm audit` (high-severity advisory inside
  `inngest`'s dependencies, no safe fix yet).

- `BACKLOG.md` in this repo has not yet been reviewed in this context
  system — reconcile with the staging-folder `backlog.md` which may be
  stale/duplicate content for the same project.
- Untracked `test-image-gen.mjs` — confirm if it should be committed,
  gitignored, or deleted.
- The staging folder `~/Documents/Claude/Projects/Garden-Bot/` is NOT this
  repo and has no git history — treat any docs there as possibly outdated
  vs. this repo's actual code/branch state.

## Key File Map

- `BACKLOG.md` (this repo) — current task backlog, check for latest priorities
- `handover-staged-pipeline.md` (if present) — staged pipeline handover notes
- `.env.local` / `.env.local.example` — environment config (never commit real values)
