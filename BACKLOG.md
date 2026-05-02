# Dedrab Backlog
Living task list. Edit via Claude Code prompts.

## Now
- [ ] Fix Gemini API delays — current priority before anything else.
- [ ] Header hamburger menu (mobile) — add a burger nav in the site header exposing the same links currently only in the footer (Examples, How It Works, What You Get, Notes, Design Tool). Header CTA "Build my Garden Plan" stays. Apply across `/`, `/design`, `/next`, `/notes`, `/notes/[slug]`. Acceptance: mobile users can reach every footer-linked section from the top of the page without scrolling to the footer.
- [ ] Footer text contrast on mobile — section labels (EXAMPLES, HOW IT WORKS, WHAT YOU GET, NOTES, DESIGN TOOL) are near-illegible against the dark footer background. Lift to a colour that meets WCAG AA contrast on `#0a1a0a`-ish background. Verify on a real device, not just desktop devtools.

## Next (SEO + AEO follow-through)
- [ ] Standardise canonical hostname on `https://www.dedrab.com` — sitemap, RSS, canonicals, OG URLs, JSON-LD. (Block 2 from 30 Apr SEO fix.)
- [ ] Cloudflare robots.txt → Content Signals Policy — unblock GPTBot, Google-Extended, Applebot-Extended for AEO traffic.
- [ ] Bing Webmaster Tools setup — import from Google Search Console, submit sitemap. ChatGPT search runs on Bing.
- [ ] URL-inspect 9 Notes URLs in Search Console — request indexing manually.

## Notes (content + UX)
- [ ] Add header navigation to `/notes` and `/notes/[slug]` — currently only a footer; visitors landing from Google have no way back to home or design tool. Match header style of `/`, `/design`, `/next`.
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
- [x] Rename "Action Plan" → "Garden Plan" across UI, PDF, legal, MDX (2 May).
- [x] Two missing Notes articles committed and pushed (30 Apr).
- [x] Sitemap submitted to Google Search Console (30 Apr).
- [x] Stripe `/next` payment screen built and live (live before 30 Apr).
- [x] Notes content system — first 8 articles published.
