# Dedrab Backlog
Living task list. Edit via Claude Code prompts.

## Now
- [x] **Canonical hostname fix — DONE 22 May 2026** (both code and platform layers live). Verified `curl -sI https://dedrab.com/notes/plant-hardiness-zones-ireland-beginners-guide` returns `HTTP/2 308` with correct location header; www continues to serve 200. Code shipped: `metadataBase` in layout.tsx + host-based permanent redirect in next.config.ts. Platform shipped: Vercel project Domains → `dedrab.com` (apex) configured as 308 Permanent Redirect to `www.dedrab.com`. Gotcha noted in memory: Vercel defaults new domain redirects to 307 Temporary, must be flipped to 308 explicitly or Google won't consolidate signal. Architecture correction also noted: Cloudflare IS proxying dedrab.com traffic (Proxy Detected badge in Vercel), not registrar-only as previously assumed. **Remaining (Steen, ~24h from now):** Search Console → URL-inspect the three apex URLs from the Pages tab, request reindexing of the www variants. Don't manually deindex apex — Google works it out from the 308.
- [ ] **Pipeline health canary (NEXT)**. Phase 1a's Inngest outage was hidden for a week because nothing alerted when the function stopped firing. Build a heartbeat: 1-min scheduled Inngest function writes `last_seen_at` to a `pipeline_health` row; a Vercel cron hits `/api/health/inngest` every 5 min and emails `steen.gordon@gmail.com` if `last_seen_at` is stale > 5 min. Also: add a circuit-breaker to `/api/redesign` that refuses new submissions if heartbeat is stale, so we never take payment for a job the pipeline can't deliver.
- [ ] **Phase 1b — Progressive reveal**. Now that 1a is live, ship the conversion win: route users to `/next-steps` the moment `designJSON` is ready (~90 s in) rather than waiting for the render, with a placeholder render panel that fills in when the image lands. Adds a stage-keyed progress panel keyed to pipeline phase (`analysing → designing → rendering → finalising`), and a refine-while-waiting capture panel (kids/pets, maintenance hours) to turn dead time into product data.

## Done (recent)
- [x] **Phase 1a — Paid-customer safety net (live 12 May)**. 4-min render + 12-min client poll timeout used to show paid users a "please try again" message while the pipeline was still running server-side. End-to-end fix verified with smoke test DED-202605-4YLY (2m 53s, status=complete, email delivered to sgord9@gmail.com). Shipped:
  1. Migration `011_pipeline_jobs_recipient_email.sql` adds `recipient_email`, `session_id`, `design_style`, `hardiness_zone`, `reference_number`, `email_sent_at`, `email_send_error` to `pipeline_jobs`.
  2. `/api/redesign` accepts `userEmail`, stores it on the job row, passes it into the Inngest event.
  3. Inngest pipeline has two new final steps: `save-design-record` (upserts a `design_records` row server-side with `full_report`, `render_url`, `reference_number` — so the email link works on any device) and `email-plan-ready` (Resend email with deep link `/next-steps?sessionId=…`).
  4. `/api/design-record` returns `full_report` and `hardiness_zone`.
  5. `/next-steps` hydrates sessionStorage from `/api/design-record` when arriving fresh from an email link.
  6. `/design` loading screen reveals a "we'll email you when it's ready" reassurance banner after 60 s. The 12-min client timeout no longer dumps users back to upload with an error — instead it routes to a new `emailFallback` screen.
- [x] **Pipeline output size fix (12 May)**. Inngest step output payload limit (~4MB) was killing every run at the Finalization phase between `concept-base-plan` and `generate-render`. Refactored `concept-base-plan`, `generate-render`, `validate-render`, `retry-if-needed`, `save-results` to persist generated PNGs to Supabase Storage inside the producing step and return only the storage path string. Also bumped `/api/inngest` maxDuration to 300s in vercel.json so long Gemini steps don't get killed by Vercel's default 60s timeout.
- [x] **Inngest function re-sync (12 May)**. Inngest hadn't been picking up events since 5 May — Cloudflare WAF was silently blocking the resync calls to `/api/inngest`. Added a Cloudflare WAF custom rule that skips Bot Fight Mode / Managed Rules / Rate Limiting for path `/api/inngest`. Inngest dashboard resync now succeeds.
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
- [x] ~~Standardise canonical hostname on `https://www.dedrab.com`~~ — **promoted to Now on 22 May, see top of file.**
- [ ] Cloudflare robots.txt → Content Signals Policy — unblock GPTBot, Google-Extended, Applebot-Extended for AEO traffic.
- [ ] Bing Webmaster Tools setup — import from Google Search Console, submit sitemap. ChatGPT search runs on Bing.
- [ ] URL-inspect 9 Notes URLs in Search Console — request indexing manually (after canonical fix lands, so we don't re-submit split URLs).

## SEO content strategy (locked 22 May)
Google Search Console at 22 May shows site impressions = 63/wk, avg position 28.6. Strongest existing signal is a cluster of hardiness queries (rhs hardiness ratings, h4/h5 hardiness, hardiness scale, ireland growing zone) all mapping to `plant-hardiness-zones-ireland-beginners-guide.mdx`. Second-strongest is "ask a landscaper" (6 impressions). Strategy: build topical clusters around proven signals, not chase competitive head terms.

**Three rules now in force for all Notes work:**
1. Every new Notes article links inline to 2–3 existing related pieces. Standalone islands are not acceptable.
2. When publishing a new article in a cluster, retro-patch the existing siblings to link back. Same PR.
3. Every article ends with a soft, in-context CTA into the dedrab tool (no pop-ups, no hard sells).

**Retro-link sweep across pre-existing library — DONE 22 May 2026.** All 12 articles published before the 22 May cluster work now carry Related Notes footers (4 cluster + cross-cluster links each), at least 1 inline contextual link in body prose to a related article, and a soft dedrab CTA. Hyphen / em-dash rule applied to new prose I added only; existing prose left as written. From this date forward the rules above apply at creation time, so no future bulk sweep should be needed.

### Hardiness Cluster — beginner-friendly, UK & Ireland led
Publishing cadence + queue tracked in `docs/publishing-schedule.md`. One article per week on Tuesdays; refreshes ship immediately (no cadence slot).

- [x] **Pillar refresh** (live 22 May) — `plant-hardiness-zones-ireland-beginners-guide.mdx`. "Why This Matters in Your Back Garden" opener, inline links to siblings, "A Note on a Shifting Climate" closing block, Related Notes footer (patched twice in 22 May commits to include all four currently-drafted satellites), soft dedrab CTA.
- [x] **Satellite 4a (Irish vineyard)** — drafted 22 May, scheduled 2026-05-26. `your-own-irish-vineyard.mdx`. Real Irish vineyard examples + Met Éireann/Teagasc citations.
- [x] **Satellite 4b (British vineyard)** — drafted 22 May, scheduled 2026-06-02. `your-own-british-vineyard.mdx`. Real UK vineyard examples + Met Office/WineGB citations.
- [x] **Satellite 1 (plant label decoder)** — drafted 22 May, scheduled 2026-06-09. `what-do-plant-label-symbols-mean.mdx`. Beginner-friendly decoder. Inline links to pillar + low-maintenance + Satellite 2. RHS citations.
- [x] **Satellite 2 (RHS↔USDA translator)** — drafted 22 May, scheduled 2026-06-16. `rhs-hardiness-vs-usda-zones.mdx`. Conversion table + plain-language explainer + drainage trap explanation. Inline links to pillar + Satellite 1 + low-maintenance + Irish vineyard.
- [ ] **Satellite 3 (grandmother's garden)** — HELD. Target slot 2026-06-23 still reserved. Write after vineyard pieces have 2+ weeks of Search Console data so we can pivot if needed.

### Conversion content — "Ask a Landscaper"
Reframed 22 May based on Search Console Pages data — `before-you-hire-a-landscaper.mdx` was already pulling 13 impressions/week with no optimisation. Strategy: refresh the existing piece FIRST to claim "ask a landscaper" explicitly; build the dedicated landing page as a complement only if Search Console data warrants it.

- [x] **Refresh `before-you-hire-a-landscaper.mdx`** — drafted 22 May. Title and description updated with "ask a landscaper" phrasing. New "Questions to Ask a Landscaper at the First Meeting" FAQ block with 6 Q&As, each Q phrased to capture a likely search variant. `hasFaq: true` added to frontmatter (triggers FAQ JSON-LD schema). Inline links to hardiness pillar + cost breakdown. Related Notes footer + soft dedrab CTA. `updatedAt: 2026-05-22` added, `publishedAt: 2026-05-01` preserved (refresh, not new article — keeps URL freshness signal intact).
- [ ] **Dedicated `/ask-a-landscaper` landing page** — HELD. Wait 2–3 weeks after refresh ships, watch Search Console for `before-you-hire-a-landscaper` impression changes. If refresh alone captures the intent, landing page becomes optional / supplementary. If "ask a landscaper" query starts pulling impressions to the refresh, that's the signal to build the dedicated landing page as a higher-conversion variant.

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
- [x] Notes article: "DIY Garden Makeover Plan: A Realistic Weekend-by-Weekend Guide" — phased weekend-by-weekend renovation guide, soft funnel to Dedrab tool (22 May).
- [x] Notes article: "Low Maintenance Garden Ideas by Climate Zone: What Actually Thrives Where" — climate-led low-maintenance planting + structure, soft funnel to Dedrab tool (22 May). **Hero image still to be generated** — placeholder coverImage path `/images/notes/low-maintenance-garden-ideas-by-climate.png`.
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
