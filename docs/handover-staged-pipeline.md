# Handover: Staged Pipeline — feature/staged-pipeline

**Date:** 15 Nov 2026
**Branch:** `feature/staged-pipeline` (from `security/phase-0`, do NOT merge to main yet)
**Author:** Claude Sonnet 4.6

---

## What was built

A complete geometry-to-planting-plan pipeline in 6 stages, with all code
gated behind feature flags and invite cookies so it is invisible in production
until explicitly enabled.

### Stage 0 — Test infrastructure
- Vitest (`^5.1.0`) + Vite (`^8.3.8`) installed as dev dependencies.
- `vitest.config.ts` at project root; runs all `src/**/*.test.ts` files.
- Script: `npm test`.

### Stage 1 — Geometry library (`src/lib/site-model/`)
| File | Purpose |
|------|---------|
| `homography.ts` | 4-point DLT homography via Gaussian elimination. `computeHomography(src, dst)` → 9-element flat matrix. `applyHomography(h, x, y)` applies it. |
| `dimensions.ts` | `recoverDimensions(corners, pw, ph, knownMetres, which?, depthMetres?)` → `DimensionsResult`. Uses vanishing-point intersection + Zhang-He aspect-ratio recovery. Returns `confidence: 'measured' | 'estimated' | 'depth_required'`. Straight-on garden photos correctly return `depth_required`. |
| `sun-grid.ts` | `buildSunGrid(w, d, facing, hemisphere, heights?)` → `SunGridResult`. 0.5 m cells. Rule: cells within 1× boundary height on the shaded side = `shade`; within 2× = `part_shade`. Both hemispheres and all 8 compass headings supported. `grid[row][col]`, row 0 = rear (top), row (rows-1) = front (bottom). |
| `__tests__/` | 21 unit tests covering identity, round-trip, synthetic projection, sun-grid shading rules. |

### Stage 2 — SVG plan component (`src/components/plan/`)
| File | Purpose |
|------|---------|
| `planTypes.ts` | `PlantPlacement` and `PlanSvgProps` interfaces (shared by components and shopping list). |
| `PlanSvg.tsx` | Pure SVG, server + client. Seeded xorshift32 PRNG for deterministic wobble. Sun tinting from sunGrid, 1 m grid, wobbly boundary outline, plant circles with number labels, north arrow, 2 m scale bar, 2-column legend. |

### Stage 3 — Lab page: site model (`src/app/lab/site-model/`)
Gated: `process.env.LAB_ENABLED === 'true'` AND valid `dedrab_invite` cookie.

- Photo upload via file input or drag-and-drop.
- 4 draggable corner pins (Pointer API, touch + mouse).
- Live `recoverDimensions` result panel.
- Live `buildSunGrid` result.
- Live `PlanSvg` preview with 8 sample plants from fixture.

### Stage 4 — Plant database (`supabase/migrations/`, `src/data/`)
| File | Purpose |
|------|---------|
| `supabase/migrations/20261115000000_plants_table.sql` | Schema for `public.plants`. CHECK constraints on `plant_type` and `rhs_hardiness`. GIN indexes on `light` and `style_tags`. RLS enabled, no public policies. **NOT applied to production.** |
| `src/data/plants-fixture.json` | 60 real garden-centre plants (p001–p060). Trees, shrubs, perennials, grasses, climbers, groundcovers, bulbs. All fields match the SQL schema. All `reviewed: false`. All have RHS source URLs. |

### Stage 5 — Planting engine (`src/lib/planting/`)
| File | Purpose |
|------|---------|
| `types.ts` | `PlantRecord`, `SiteContext`, `ShortlistedPlant`, `PlantingSuggestion`, `GenerateResult`, `ValidationResult`, `ShoppingItem`. |
| `shortlist.ts` | Hard filters: RHS hardiness (H7 = hardiest), light tolerance. Scoring: style tag match (0.5), summer interest (0.3), evergreen (0.2). Returns up to `limit` plants ordered by score. |
| `prompt.ts` | Builds the Gemini text prompt. Pure function, no I/O. Embeds garden dimensions, light, hardiness, style, and shortlisted plant list. Instructs Gemini to return a JSON array. |
| `generate.ts` | Single Gemini text call. Model: `GEMINI_TEXT_MODEL` env var (default `gemini-2.5-flash`). 60 s timeout via `AbortController`. Parses JSON array from response. **Server-only** — not in barrel export. |
| `validate.ts` | Pure validation: unknown IDs, out-of-bounds positions (0.1 m tolerance), non-integer/zero quantity, duplicate positions. Returns `{ valid, issues }`. |
| `repair.ts` | One repair round: clamp out-of-bounds, fix quantity, nudge duplicates, drop unknowns. |
| `shopping-list.ts` | Groups suggestions by plant_id, sums quantities, looks up display names, assigns GBP price bracket heuristics. Sorted: trees first, then shrubs, etc. |
| `index.ts` | Barrel export (generate.ts excluded). |
| `__tests__/` | 22 unit tests for validate.ts and shortlist.ts. |

**Note on GOOGLE_API_KEY:** The key was confirmed suspended as of Aug 2026 (see BACKLOG.md URGENT section). The generate step will return a 403 error until a new key is in place.

### Stage 6 — Jobs, Inngest, API routes, results page
| File | Purpose |
|------|---------|
| `supabase/migrations/20261115000001_plan_jobs_table.sql` | Schema for `public.plan_jobs`. Status lifecycle: `queued → generating → validating → repairing → done | failed`. Stores shortlist_ids, raw/validated suggestions, shopping_list (jsonb). `invite_code` column scopes results to caller. `updated_at` trigger. **NOT applied to production.** |
| `src/inngest/functions/plan-start.ts` | `plan/start` Inngest function. 5 steps: shortlist, generate, validate, repair, persist. Updates `plan_jobs.status` at each step. Catches and persists errors to `plan_jobs.error_message`. |
| `src/inngest/functions/render-start.ts` | `render/start` stub. Verifies job is done; returns `rendered: false`. Stage 7 fills in PDF generation. |
| `src/app/api/inngest/route.ts` | Registered `planStartFunction` and `renderStartFunction` alongside existing functions. |
| `src/app/api/plan/create/route.ts` | `POST /api/plan/create`. Validates input (bounds, enum checks), inserts `plan_jobs` row, fires `plan/start` Inngest event. Auth: `requireInvite`. Returns `{ job_id }` (201). |
| `src/app/api/plan/status/route.ts` | `GET /api/plan/status?job_id=`. Returns current job state. Auth: `requireInvite` + `invite_code` column equality — callers can only see their own jobs. |
| `src/app/lab/plan/page.tsx` | Server component. Same `LAB_ENABLED` + invite gating as `/lab/site-model`. |
| `src/app/lab/plan/PlanLabClient.tsx` | Interactive form. Submits to `/api/plan/create`, polls `/api/plan/status` every 2 s. Shows live status banner, renders `PlanSvg` + shopping list table when `status === 'done'`. |

---

## How to test locally

1. Set env vars in `.env.local`:
   ```
   LAB_ENABLED=true
   GOOGLE_API_KEY=<new key — see BACKLOG URGENT>
   NEXT_PUBLIC_SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
2. Apply both migrations to your local Supabase instance (or a dev branch):
   ```
   supabase/migrations/20261115000000_plants_table.sql
   supabase/migrations/20261115000001_plan_jobs_table.sql
   ```
3. Set a valid `dedrab_invite` cookie in the browser (use the invite page or set it directly in DevTools).
4. Visit `/lab/site-model` to test geometry + plan preview.
5. Visit `/lab/plan` to test the full generation pipeline.

---

## Stage 7 — PDF generation (complete)

| File | Purpose |
|------|---------|
| `src/components/plan/pdf/PlanDocument.tsx` | React-PDF A4 document. Forest & Gold header, plan drawing as PDF SVG primitives (grid, boundary, plant circles with dashed arcs, north arrow, scale bar), shopping list table with alternating rows. Longhand styles only. Server-only — never imported by client components. |
| `src/inngest/functions/render-start.ts` | Full implementation: fetch job, build PlantPlacements from suggestions, `dynamic import('@react-pdf/renderer')` to stay ESM-safe, `renderToBuffer`, upload to `pdfs` bucket as `plan-<job_id>.pdf`, persist `pdf_url`. |
| `supabase/migrations/20261115000002_plan_jobs_pdf_url.sql` | Adds `pdf_url text` column to `public.plan_jobs`. **NOT applied to production.** |

`plan-start.ts` fires `render/start` via `step.sendEvent` after the persist step, so PDF generation chains automatically.

`next.config.ts` sets `serverExternalPackages: []` to prevent Next.js from trying to `require()` the pure-ESM `@react-pdf/renderer` package (which would fail at runtime).

---

## Files not modified (per instructions)

- `src/components/DesignTool.tsx`
- `src/inngest/functions/pipeline.ts`
- `src/app/next-steps/` and `/next/`
- Anything under `src/content/` or `src/app/notes/`

---

## Branch state

```
security/phase-0  ← base (security fixes, committed)
feature/staged-pipeline
  e9f...  feat(stage-1): geometry library + vitest
  ...
  e91ee6e feat(stage-4): plant fixture (60 plants) and SQL migration
  9aab3df feat(stage-5): planting engine
  07ad980 feat(stage-6): plan_jobs migration, Inngest functions, API routes, /lab/plan page
  ed2b2e5 docs: update BACKLOG and write handover
  c5cf039 feat(stage-7): server-side PDF generation via @react-pdf/renderer
```

All 7 stages complete. TSC clean, 43 tests passing, build clean.

Do NOT merge to `main` until:
1. All three SQL migrations are applied to production (plants, plan_jobs, plan_jobs_pdf_url).
2. The GOOGLE_API_KEY is replaced (see BACKLOG URGENT).
3. R6 payments gate is cleared (see BACKLOG: Render pipeline reliability).
