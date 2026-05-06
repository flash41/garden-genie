# Dedrab Backlog
Living task list. Edit via Claude Code prompts.

## Now
- [ ] Fix Gemini API delays — current priority before anything else.
- [ ] Migrate `/design`, `/next`, `/next-steps`, `/invite` to the shared `SiteHeader` component — they still have inline nav blocks. Replace with `<SiteHeader variant="solid" />` (or `"hero"` if they have a full-bleed hero). Confirms hamburger consistency across the whole site.
- [ ] **PDF fallback overwrite bug** — `/next-steps` `generatePdfFallback` re-fires on every revisit and uploads an empty-shell PDF (`doc=null`) over the good one via `upsert: true`. Confirmed against `DED-202605-QRSQ` (Jon Reilly trial run, 2026-05-04): full report intact in DB, but PDF in storage was overwritten on 2026-05-05 with a 2.37 MB content-less file. Three fixes needed:
  1. Guard `generatePdfFallback` in `src/app/next-steps/page.tsx`: if `doc` is null after reading sessionStorage, fetch `full_report` from `/api/design-record` before rendering. If still null, bail — never upload an empty shell.
  2. Make `/api/upload-pdf` non-destructive: refuse `upsert` when the existing object is larger than the incoming buffer, OR require an explicit `force: true` flag (default false).
  3. Skip the fallback on revisits: `GET /api/design-record` first; if `pdf_url` is already set, populate local state and don't generate.
  Item 1 alone closes the failure mode; items 2 and 3 are belt-and-braces.

## Next (SEO + AEO follow-through)
- [ ] Standardise canonical hostname on `https://www.dedrab.com` — sitemap, RSS, canonicals, OG URLs, JSON-LD. (Block 2 from 30 Apr SEO fix.)
- [ ] Cloudflare robots.txt → Content Signals Policy — unblock GPTBot, Google-Extended, Applebot-Extended for AEO traffic.
- [ ] Bing Webmaster Tools setup — import from Google Search Console, submit sitemap. ChatGPT search runs on Bing.
- [ ] URL-inspect 9 Notes URLs in Search Console — request indexing manually.

## Notes (content + UX)
- [ ] Notes content system (semi-automated) — admin queue → drafts → review → schedule. Build after Gemini delays + reference articles.

## Product flow
- [ ] Reorder payment flow. `/design` should be entry point. User uploads photo + selects style first. `/next` (€4.95 payment) appears immediately before Gemini pipeline fires. On Stripe success or invite code, return to design page with selections preserved and run pipeline. Acceptance: new user uploads → chooses style → clicks Generate → sees €4.95 → pays → render fires without losing inputs.

## Phase 2 (pre-launch)
- [ ] Aerial layout plan scale grid — clean rebuild — remove canvas overlay entirely, rebuild from scratch.
- [ ] Wire colour palette swatches to hex values — currently empty boxes.
- [ ] Before/After comparison slider on results page.
- [ ] Examples carousel — manual image prep in `public/examples/` with theme-specific filenames.

## Phase 3 (go live)
- [ ] Cloudflare proxy SSL — enable orange cloud between Cloudflare and Vercel at public launch.
- [ ] Subdomain migration for `/notes` — defer until Cloudflare proxy work.

## Exploration / validation
- [ ] B2B garden centre licensing — validate as a revenue channel.

## Done (recent)
- [x] Notes article: "How Would I Get Me Garden From Drab to Fab?" — 8 weekend-doable lifts, points reader to top-of-page CTA (6 May).
- [x] Shared `SiteHeader` with mobile hamburger menu — landing + all `/notes` pages (2 May).
- [x] Footer text contrast lifted to WCAG AA (`white/30` → `white/75`, etc.) (2 May).
- [x] Rename "Action Plan" → "Garden Plan" across UI, PDF, legal, MDX (2 May).
- [x] Two missing Notes articles committed and pushed (30 Apr).
- [x] Sitemap submitted to Google Search Console (30 Apr).
- [x] Stripe `/next` payment screen built and live (live before 30 Apr).
- [x] Notes content system — first 8 articles published.
