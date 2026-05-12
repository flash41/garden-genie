# Dedrab Backlog
Living task list. Edit via Claude Code prompts.

## Now
- [ ] **Phase 1a — Paid-customer safety net (IN PROGRESS, 12 May)**. The 4-min render + 12-min client poll timeout had been showing paid users a "please try again" message when the pipeline was still running server-side — risking double-charging and lost trust. Cowork-side file edits done; needs Claude Code to apply migration + tsc + push. Changes:
  1. New migration `supabase/migrations/011_pipeline_jobs_recipient_email.sql` adds `recipient_email`, `session_id`, `design_style`, `hardiness_zone`, `reference_number`, `email_sent_at`, `email_send_error` to `pipeline_jobs`.
  2. `/api/redesign` accepts `userEmail`, stores it on the job row, passes it into the Inngest event.
  3. Inngest pipeline gets two new final steps: `save-design-record` (upserts a `design_records` row server-side with `full_report`, `render_url`, `reference_number` — so the email link works on any device) and `email-plan-ready` (Resend email with deep link `/next-steps?sessionId=…`).
  4. `/api/design-record` now returns `full_report` and `hardiness_zone`.
  5. `/next-steps` hydrates sessionStorage from `/api/design-record` when arriving fresh from an email link.
  6. `/design` loading screen reveals a "we'll email you when it's ready" reassurance banner after 60 s. The 12-min client timeout no longer dumps users back to upload with an error — instead it routes to a new `emailFallback` screen reassuring them the server-side pipeline will deliver.
- [ ] **Phase 1b — Progressive reveal (NEXT)**. Once 1a lands, ship the conversion win: route users to `/next-steps` the moment `designJSON` is ready (~90 s in) rather than waiting for the render, with a placeholder render panel that fills in when the image lands. Adds a stage-keyed progress panel keyed to pipeline phase (`analysing → designing → rendering → finalising`), and a refine-while-waiting capture panel (kids/pets, maintenance hours) to turn dead time into product data.
- [ ] **Old strategy memo (superseded by 1a/1b above, 12 May)**. Original 7 May plan was: (1) stream Gemini response token-by-token; (2) multi-stage progress panel; (3) brief-refining panel; (4) email-when-ready fallback; (5) Gemini 2.0 Flash for free demo. Phase 1a delivers (4) — the foolproof safety net. Streaming and stage panel are folded into Phase 1b.
- [ ] **Homepage hero — split panel: rotating reveal + rotating deliverables** (locked 12 May). Replace the static "Sunlit Border Garden" mockup card on the right of the hero with a two-panel framed widget that sells both the *vision* and the *value*. **Top panel** (~340×220): before→after reveal cycling through `EXAMPLES` from `src/data/examples.ts`. Per slide: before image holds ~1.2s, after wipes in over ~700ms via `clip-path: inset(0 0 0 0%)`, holds ~3.5s, then 300ms crossfade to next example's before. Caption beneath top panel updates per slide (`style` + description). **Bottom panel** (~340×200): cycles through four deliverable preview thumbnails staged at `public/hero-deliverables/` — `plant-list-preview.png`, `layout-plan-preview.png`, `cost-estimate-preview.png`, `materials-preview.png` (all 560×373, 3:2, cropped from `example-report-zen-Proposal.pdf` pages 5/11/10/7). Each deliverable holds ~2.2s, 400ms crossfade between. Two rotations run independently so the eye always has motion. **Chip row** (4 chips, in sync with bottom panel): `PLANT LIST · LAYOUT PLAN · COST ESTIMATE · MATERIALS`. Active chip = gold keyline + pulsing dot; inactive = dim. Auto-rotate, pause-on-hover, respect `prefers-reduced-motion` (static frame fallback). Same frame chrome as today; no mobile layout shift. Queued AFTER the 4-min wait fix lands.
- [ ] Migrate `/design`, `/next`, `/next-steps`, `/invite` to the shared `SiteHeader` component — they still have inline nav blocks. Replace with `<SiteHeader variant="solid" />` (or `"hero"` if they have a full-bleed hero). Confirms hamburger consistency across the whole site.
- [ ] **PDF fallback overwrite bug** — `/next-steps` `generatePdfFallback` re-fires on every revisit and uploads an empty-shell PDF (`doc=null`) over the good one via `upsert: true`. Confirmed against `DED-202605-QRSQ` (Jon Reilly trial run, 2026-05-04): full report intact in DB, but PDF in storage was overwritten on 2026-05-05 with a 2.37 MB content-less file. Three fixes needed:
  1. Guard `generatePdfFallback` in `src/app/next-steps/page.tsx`: if `doc` is null after reading sessionStorage, fetch `full_report` from `/api/design-record` before rendering. If still null, bail — never upload an empty shell.
  2. Make `/api/upload-pdf` non-destructive: refuse `upsert` when the existing object is larger than the incoming buffer, OR require an explicit `force: true` flag (default false).
  3. Skip the fallback on revisits: `GET /api/design-record` first; if `pdf_url` is already set, populate local state and don't generate.
  Item 1 alone closes the failure mode; items 2 and 3 are belt-and-braces.

## Security audit follow-up
- [ ] Flag CSP `connect-src` / `script-src` finding to the audit — `https://www.google-analytics.com` was too narrow for GA4 region endpoints, silently dropped all analytics for ~5 days. Audit should check for the same shape of mistake elsewhere (other vendor SDKs that use regional or sharded subdomains: Stripe, Supabase, anything new).
- [ ] Once GA is collecting again, add a synthetic monitor or weekly check that GA event count > 0 over a 7-day window. Silent failure mode shouldn't recur undetected.

## Next (SEO + AEO follow-through)
- [ ] Standardise canonical hostname on `https://www.dedrab.com` — sitemap, RSS, canonicals, OG URLs, JSON-LD. (Block 2 from 30 Apr SEO fix.)
- [ ] Cloudflare robots.txt → Content Signals Policy — unblock GPTBot, Google-Extended, Applebot-Extended for AEO traffic.
- [ ] Bing Webmaster Tools setup — import from Google Search Console, submit sitemap. ChatGPT search runs on Bing.
- [ ] URL-inspect 9 Notes URLs in Search Console — request indexing manually.

## Notes (content + UX)
- [ ] **PARKED 7 May** — Notes content system (semi-automated). Spec done at `docs/specs/notes-admin-system.md` for when revisited. ~1 week build deemed poor ROI at current article volume; MDX-in-repo workflow is functional. Revisit when content cadence increases or someone other than Steen needs to publish.

## Product flow
*(payment flow reorder shipped — see Done)*

## Phase 2 (pre-launch)
- [ ] Aerial layout plan scale grid — clean rebuild — remove canvas overlay entirely, rebuild from scratch.
- [ ] Wire colour palette swatches to hex values — currently empty boxes.
- [ ] Before/After comparison slider on results page.
- [ ] Examples carousel — manual image prep in `public/examples/` with theme-specific filenames.

## Phase 3 (go live)
- [ ] Cloudflare proxy SSL — enable orange cloud between Cloudflare and Vercel at public launch.
- [ ] ~~Subdomain migration for `/notes`~~ — **killed 7 May.** Staying on `www.dedrab.com/notes` to preserve SEO authority. Admin tooling lives at `/admin` instead.

## Exploration / validation
- [ ] B2B garden centre licensing — validate as a revenue channel.

## Done (recent)
- [x] **GA CSP fix** — widened CSP allowlist from `https://www.google-analytics.com` to `https://*.google-analytics.com` on script-src, script-src-elem, connect-src in `next.config.ts`. GA4 region endpoints (region1.google-analytics.com etc.) were being blocked, killing all event collection from ~2 May. Cliff edge in GA matches the SiteHeader/footer batch deploy (7 May).
- [x] Reorder payment flow — `/design` as entry, `/next` (€4.95) before Gemini fires, selections preserved on return (7 May).
- [x] Notes article: "8 Features That Turn a Garden Into a Pollinator Haven" — pollinator-led planting + habitat features, soft funnel to Dedrab tool (7 May).
- [x] Notes article: "How Would I Get Me Garden From Drab to Fab?" — 8 weekend-doable lifts, points reader to top-of-page CTA (6 May).
- [x] Shared `SiteHeader` with mobile hamburger menu — landing + all `/notes` pages (2 May).
- [x] Footer text contrast lifted to WCAG AA (`white/30` → `white/75`, etc.) (2 May).
- [x] Rename "Action Plan" → "Garden Plan" across UI, PDF, legal, MDX (2 May).
- [x] Two missing Notes articles committed and pushed (30 Apr).
- [x] Sitemap submitted to Google Search Console (30 Apr).
- [x] Stripe `/next` payment screen built and live (live before 30 Apr).
- [x] Notes content system — first 8 articles published.
