# Dedrab Backlog
Living task list. Edit via Claude Code prompts.

## Now
- [ ] Fix Gemini API delays — current priority before anything else.
- [ ] Migrate `/design`, `/next`, `/next-steps`, `/invite` to the shared `SiteHeader` component — they still have inline nav blocks. Replace with `<SiteHeader variant="solid" />` (or `"hero"` if they have a full-bleed hero). Confirms hamburger consistency across the whole site.

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
- [x] Shared `SiteHeader` with mobile hamburger menu — landing + all `/notes` pages (2 May).
- [x] Footer text contrast lifted to WCAG AA (`white/30` → `white/75`, etc.) (2 May).
- [x] Rename "Action Plan" → "Garden Plan" across UI, PDF, legal, MDX (2 May).
- [x] Two missing Notes articles committed and pushed (30 Apr).
- [x] Sitemap submitted to Google Search Console (30 Apr).
- [x] Stripe `/next` payment screen built and live (live before 30 Apr).
- [x] Notes content system — first 8 articles published.
