# Handover: Staged Pipeline -- feature/staged-pipeline

**Date:** 15 Nov 2026
**Branch:** `feature/staged-pipeline` (from `security/phase-0`, do NOT merge to main yet)
**Author:** Claude Opus 4.6

---

## What was built (original stages 0-7, unchanged)

A complete geometry-to-planting-plan pipeline in 7 stages, with all code
gated behind feature flags and invite cookies. See previous handover for
stages 0-7 detail.

---

## Gap fixes applied in this session

### GAP 1: Per-position light check

**Problem:** The garden was reduced to one "dominant_light" value; validate.ts
never looked at the sun grid; render-start.ts hard-coded `light: 'full_sun'`.

**Fix:**

| File | Change |
|------|--------|
| `src/lib/planting/types.ts` | `SiteContext` now carries `cameraFacing`, `hemisphere`, `boundaryHeights`, `sunGrid`, `location`. `PlantingSuggestion` gets optional `light` field. New validation issue kinds: `wrong_light`, `too_close`. `ShoppingItem.price_bracket` removed (GAP 5). |
| `src/lib/planting/validate.ts` | `validateSuggestions` accepts optional `{ sunGrid, plantMap }`. New checks: (1) per-position light -- looks up sun-grid cell via `lookupSunCell`, rejects if cell light not in plant's light list; (2) spacing -- rejects if distance < half sum of spreads (60% threshold for same-plant drifts). Exports `lookupSunCell`. |
| `src/lib/planting/prompt.ts` | `buildPlantingPrompt` emits a compact text light map (F/P/S at 1m resolution). Removed "UK garden designer" and "(UK)". Climate described by hardiness rating + typed location. New `buildRepairPrompt` for violations. |
| `src/lib/planting/generate.ts` | API key now sent via `x-goog-api-key` header, not in the URL query string. |
| `src/inngest/functions/plan-start.ts` | Rebuilds sun grid server-side via `buildSunGrid`. Passes `sunGrid` and `plantMap` to validation. Repair step: one extra model call for `wrong_light` / `too_close` violations, re-validated; anything still failing is dropped by code. Now fires `garden-render/start` and `plan-pdf/start` events. Writes `planting_status` / `planting_error` instead of `status` / `error_message`. |
| `src/lib/planting/__tests__/validate-light-spacing.test.ts` | 12 new unit tests: shade-only plant in full-sun cell rejected, full-sun plant in shade rejected, matching light accepted, shade-tolerant plant in shade accepted, no-grid passthrough, spacing violations rejected, same-plant drifts at 60% allowed, well-spaced plants pass. |

### GAP 2: Join corner-pin screen to planting step

**Problem:** `/lab/plan` took typed width and depth; the photo never reached
the model.

**Fix:**

| File | Change |
|------|--------|
| `src/app/lab/plan/PlanLabClient.tsx` | Complete rewrite as a unified flow: upload photo, drag four corner pins (reuses the same Pointer API drag from `SiteModelLabClient`), enter one measurement (+ depth if geometry requires it), camera facing, hemisphere, boundary heights, typed location, hardiness rating, style tags. Dimensions computed live from corner pins via `recoverDimensions`. Dominant light derived from sun grid. All site model fields sent to `/api/plan/create`. Results shown staged (see GAP 6). |

**Not yet done:** The photo upload to the `pipeline-assets` bucket and the planting model call receiving the photo are not wired up. The `/api/plan/create` route accepts the new fields but does not yet accept a multipart photo upload. This requires a separate file-upload endpoint or multipart handling in the create route. The photo is used by the garden render function if `photo_path` is set on the job.

### GAP 3: Mature garden render

**Problem:** "render/start" only built the PDF. No image render existed.

**Fix:**

| File | Change |
|------|--------|
| `src/inngest/functions/render-start.ts` | Renamed from `render/start` to `plan-pdf/start` (function id `plan-pdf`). Export renamed to `pdfStartFunction`. Reads `planting_status` instead of `status`. onFailure handler writes `pdf_status: 'failed'` + `pdf_error`. Uploads to `pipeline-assets` bucket, stores path (not URL). |
| `src/inngest/functions/garden-render.ts` | **New.** `garden-render/start` (function id `garden-render`). ONE image model call using the original photo + shopping list summary. Model from `GEMINI_IMAGE_MODEL` env var (default `gemini-2.0-flash-exp`). 120s timeout, retries: 2. Saves PNG to `pipeline-assets`, stores path. onFailure handler writes `render_status: 'failed'`. Sends plan-ready email after completion or on failure. |
| `src/app/api/inngest/route.ts` | Registers `pdfStartFunction` and `gardenRenderFunction`. |
| `supabase/migrations/20261115000003_plan_jobs_staged_statuses.sql` | **New migration.** Adds: `planting_status`, `render_status`, `pdf_status` (each `queued\|running\|complete\|failed`), `planting_error`, `render_error`, `pdf_error`, `photo_path`, `render_path`, `pdf_path`, `hemisphere`, `boundary_heights` (jsonb), `location`, `corners` (jsonb). |

### GAP 4: Reliability and guards

| File | Change |
|------|--------|
| `src/app/api/plan/create/route.ts` | `limitOr429` at 10/hour. Accepts `hemisphere`, `boundary_heights`, `location`. If `inngest.send` fails, marks job `planting_status: 'failed'` and returns 502. |
| `src/app/api/plan/status/route.ts` | `limitOr429` at 600/hour. Validates `job_id` with `UUID_RE`. Returns time-limited signed URLs for render and PDF (1h expiry). Raw storage paths removed from response. Reads new staged status columns. |

### GAP 5: Remove prices, UK bias, serverExternalPackages

| File | Change |
|------|--------|
| `src/lib/planting/shopping-list.ts` | `priceBracket` function and all price logic removed. |
| `src/lib/planting/types.ts` | `price_bracket` field removed from `ShoppingItem`. |
| `src/app/lab/plan/PlanLabClient.tsx` | Price column removed from shopping list table. `PRICE_LABELS` removed. |
| `src/components/plan/pdf/PlanDocument.tsx` | `PRICE_LABEL` map and price column removed from PDF table. |
| `src/lib/planting/prompt.ts` | "UK garden designer" and "(UK)" removed (done in GAP 1). Climate described by hardiness + location only. |
| `next.config.ts` | `serverExternalPackages: []` tested: `npm run build` passes both with and without. Kept for runtime safety (PlanDocument.tsx statically imports @react-pdf/renderer which is pure ESM). Comment updated to document the test. |

### GAP 6: Staged results view + plan-ready email

| File | Change |
|------|--------|
| `src/app/lab/plan/PlanLabClient.tsx` | Shows plan drawing + checkbox shopping list as soon as `planting_status` is `complete`. Shows render image when `render_status` is `complete`. Shows PDF download link when `pdf_status` is `complete`. Shows plain messages for failed render/PDF. Polls until all three statuses are terminal. |
| `src/lib/plan-email.ts` | **New.** `sendPlanReadyEmail` copied from pipeline.ts. Updated: no price references, dynamic import of Resend. |
| `src/inngest/functions/garden-render.ts` | Sends plan-ready email in step 4 (after render completes) and from `onFailure` (so email always goes out once planting is done). No-op if no `recipient_email` on the job row. |

---

## What is tested

- **Unit tests (55 total, all passing):**
  - 21 geometry tests (homography, dimensions, sun-grid)
  - 10 shortlist tests (hardiness, light, scoring)
  - 12 validate-light-spacing tests (per-position light, spacing, drifts)
  - 12 original validate tests (bounds, quantity, duplicates)
- **TSC:** `npx tsc --noEmit` clean
- **Build:** `npm run build` clean

## What is NOT tested

- **Live Gemini API calls:** The `GOOGLE_API_KEY` was confirmed suspended as of Aug 2026. All generate/render calls will fail with 403 until a new key is provisioned. Unit tests use fixture data only.
- **Photo upload flow:** The `/api/plan/create` route does not yet handle multipart photo uploads. The photo needs to be uploaded to `pipeline-assets` and its path stored on the job. The garden-render function checks for `photo_path` and will error if it is null.
- **Plan-ready email:** Requires `RESEND_API_KEY` and a `recipient_email` column on the job (not in the current migration). The email function is a no-op without these.
- **Supabase Storage:** The `pipeline-assets` bucket must exist. The signed URL generation in the status route requires the bucket to be configured.
- **Database schema:** Migration 20261115000003 has not been applied. The old `status` and `error_message` columns still exist alongside the new staged columns. Production code should migrate data from `status` to `planting_status` before removing the old columns.

---

## Environment variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `LAB_ENABLED` | Yes (for lab pages) | -- | Gate for /lab/* pages |
| `GOOGLE_API_KEY` | Yes (for pipeline) | -- | Gemini API key (text + image) |
| `GEMINI_TEXT_MODEL` | No | `gemini-2.5-flash` | Text model for planting suggestions |
| `GEMINI_IMAGE_MODEL` | No | `gemini-2.0-flash-exp` | Image model for garden render |
| `RESEND_API_KEY` | No | -- | For plan-ready email (no-op without) |
| `NEXT_PUBLIC_SITE_URL` | No | `https://www.dedrab.com` | Base URL for email links |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | -- | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | -- | Supabase service role key |

---

## Migration files (apply in order)

1. `supabase/migrations/20261115000000_plants_table.sql` -- plants table
2. `supabase/migrations/20261115000001_plan_jobs_table.sql` -- plan_jobs table
3. `supabase/migrations/20261115000002_plan_jobs_pdf_url.sql` -- pdf_url column
4. `supabase/migrations/20261115000003_plan_jobs_staged_statuses.sql` -- staged statuses, paths, site model columns

All four must be applied to a dev/staging instance before testing. Do NOT apply to production until the branch is reviewed.

---

## Files not modified (per instructions)

- `src/app/design/DesignTool.tsx`
- `src/inngest/functions/pipeline.ts`
- `src/app/next-steps/page.tsx`
- Anything under `src/content/` or `src/app/notes/`
- Plant facts and source_urls in `src/data/plants-fixture.json`

---

## Known gaps and next steps

1. **Photo upload:** Wire multipart upload in `/api/plan/create` or a separate endpoint. Store in `pipeline-assets`, set `photo_path` on the job.
2. **Google API key:** Replace the suspended key. Test generate + render live.
3. **Recipient email:** Add `recipient_email` column to plan_jobs (or collect it in the UI) to enable plan-ready emails.
4. **Old status column:** Once migration 20261115000003 is applied, the old `status` and `error_message` columns on plan_jobs are redundant. Migrate existing data and drop them in a future migration.
5. **Production deploy:** Do not merge to main until migrations are applied, API key is live, and the photo upload flow is complete.

---

## Branch state

```
security/phase-0  <- base
feature/staged-pipeline
  c9117f4 feat(geometry): add site-model library
  6cf3c8a feat(plan): add PlanSvg component and plants fixture
  2f32549 feat(lab): add /lab/site-model test page
  e91ee6e feat(stage-4): plant fixture and SQL migration
  9aab3df feat(stage-5): planting engine
  07ad980 feat(stage-6): plan_jobs migration, Inngest functions, API routes
  ed2b2e5 docs: update BACKLOG and write handover
  c5cf039 feat(stage-7): server-side PDF generation
  1125c31 docs: mark stage-7 complete
  0af57e0 fix(build): bump @types/node to 22
  64f7cef feat(gap-1,3): per-position light/spacing validation, garden render, staged statuses
  74c639b feat(gap-5): remove prices, UK bias; confirm serverExternalPackages
  222af76 feat(gap-4): rate limits, UUID validation, signed links, fail-on-send
  558bfee feat(gap-2): unified corner-pin + planting flow
  8c6e3cf feat(gap-6): staged results view + plan-ready email
```

TSC clean, 55 tests passing, build clean.
