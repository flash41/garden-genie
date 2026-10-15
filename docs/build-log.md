# Dedrab Build Log

A running journal of every working session on dedrab.com. Most recent at top.

Each session entry follows the same shape: date, active working time, what shipped, commits, what's live, what's parked. Update it at the end of every session, commit alongside the work it describes.

The point of this document is twofold. First, future-me (Claude in a fresh session) can read the log and understand what came before without having to reconstruct it from git history alone. Second, Steen can see at a glance the cumulative pace of the build — what's been actually done versus what still feels undone.

---

## How to update this document

At the end of every working session, add a new entry at the top of the **Sessions** section using the template at the bottom. Commit the build-log change in the same PR as the work it describes (or a small standalone PR if the session was non-code work like Search Console clicks).

Time tracking is approximate — round to the nearest 30 minutes. Capture:
- **Active time** = time actually working, not total elapsed wall-clock with breaks.
- **Wall-clock window** = the start and end of the session day, useful for context.

Don't worry about precision; the trend matters more than the decimal.

---

## Running Totals

| Metric | Total |
|---|---|
| Sessions logged | 3 (sessions 3, 4, 5 all same day) |
| Active working time (approx) | 13.5 hours |
| Notes articles live | 17 (after 4 June deploy) |
| Notes articles scheduled (auto-publish) | 2 |
| Major systems shipped | Pipeline-health canary, canonical hostname fix, internal-link graph, publishing cadence + ISR auto-publish, FAQPage JSON-LD schema, Notes admin architecture, Phase 1a customer safety net |

---

## Sessions

### 2026-10-15 (Thursday) — Hardiness cluster CTR refresh

**Active time:** ~30 minutes

**Themes:** Refresh three hardiness-zone Notes articles with new county/region tables and improved heading structure to lift CTR; ship ToC anchor fix that was blocking scroll-to-section on all Notes pages.

**Shipped:**
- `src/content/notes/plant-hardiness-zones-ireland-beginners-guide.mdx`: added Ireland-by-county hardiness table, new H2 "Which Zone Is Your County In?" (anchored).
- `src/content/notes/what-planting-zone-is-the-uk-in.mdx`: added UK regional table, new H2 "Which Zone Is Your Region In?" (anchored).
- `src/content/notes/rhs-hardiness-vs-usda-zones.mdx`: added full H1-H7 breakdown table, new H2 "What Does Each RHS Rating Mean?" (anchored), fixed USDA conversion.
- `docs/publishing-schedule.md`: updated schedule entry for the three articles.
- `src/lib/notes.ts`: extracted `slugifyHeading()` export; `extractHeadings` uses it (identical output).
- `src/app/notes/[slug]/page.tsx`: added `h2`/`h3` MDX components that render with `id={slugifyHeading(textContent)}`; ToC filtered to H2-only (threshold ≥ 3 H2s); mobile `<details>` "On this page" block added (`lg:hidden`).
- `src/components/notes/TableOfContents.tsx`: H3 indent logic removed (H2-only now).
- `docs/content-standards.md`, `docs/templates/notes-article-template.mdx`: heading and content standards documented.
- Deleted scratch file `.chk-tmp.mjs`.

**Commits:**
- `8c6af2c` — fix(notes): add anchor IDs to headings so ToC links scroll correctly + docs
- `7828602` — content(notes): hardiness CTR refresh: Ireland county table, UK regional table, RHS H1-H7 hub, USDA conversion fix

**Live check (Googlebot UA):**
- `/notes/plant-hardiness-zones-ireland-beginners-guide` → `What Planting Zone Is Ireland In? Hardiness Zones by County` ✓
- `/notes/what-planting-zone-is-the-uk-in` → `UK Hardiness Zones: What Planting Zone Is Your Region In?` ✓
- `/notes/rhs-hardiness-vs-usda-zones` → `What Do RHS Hardiness Ratings Mean? H1 to H7 and USDA Zones` ✓

**IndexNow:** HTTP 200 — all 3 URLs submitted.

---

### 2026-08-07 (Friday) — Beta notice copy refresh + feature-request field on /next

**Active time:** ~20 minutes

**Themes:** Steen asked for softer "final development stages" copy behind the Build My Plan button on `/next`, plus an open text field so beta testers can leave feature requests, not just email addresses.

**Shipped:**
- `src/app/next/page.tsx`: replaced the beta blurb with the new copy, added an optional feedback textarea above the email row in the waitlist form, wired into a new `waitlistFeedback` state field.
- `src/app/api/waitlist/route.ts`: accepts an optional `feedback` string (trimmed, capped at 2000 chars), includes it in the Resend notification to steen.gordon@gmail.com, and now upserts against existing rows (dropped `ignoreDuplicates`) so a returning visitor's feedback still saves.
- `supabase/migrations/014_waitlist_feedback.sql` added (nullable `feedback` text column on `waitlist_signups`) and applied directly to the live `garden_genie` project via Supabase MCP `apply_migration` — checked `list_tables` first per the migration-drift lesson from 26 July, confirmed the column didn't already exist before adding it.
- `tsc --noEmit` clean.

**Commits:**
- None yet — Cowork only edits files; needs a Claude Code commit + push.

**What's now operationally live:** The `feedback` column exists in production Supabase now (schema change applied directly), independent of the repo migration file being committed.

**Parked / next:**
- None — this was a small, self-contained change.

### 2026-07-26 (Sunday, later) — Waitlist signup check reveals missing migration, applied

**Active time:** ~20 minutes

**Themes:** Steen asked how many waitlist signups there had been. Queried the live `garden_genie` Supabase project directly rather than trusting the repo — good thing, since `waitlist_signups` didn't exist there at all.

**Shipped:**
- Confirmed via `list_migrations` that the last migration actually applied to production was `20260527131847_security_hardening_2026_05_27` (27 May). `supabase/migrations/013_waitlist_signups.sql` (dated 6 July, added the same session the waitlist feature itself was reviewed) had never been run against the live database.
- Applied the migration directly via Supabase MCP (`apply_migration`, name `013_waitlist_signups`), verbatim contents of the existing repo file. `waitlist_signups` table now exists with RLS enabled, service-role policy in place.
- Ran `get_advisors` (security) post-migration: one WARN on the `USING(true)/WITH CHECK(true)` policy, but this matches the exact pattern already used on `error_reports` elsewhere in the schema (service-role bypasses RLS regardless), not a new risk introduced here.
- Confirmed 0 rows post-migration — expected, this is effectively day one for real capture. Every prior signup attempt had been silently 500'ing.
- `BACKLOG.md` updated with the root cause and a reminder: a migration file existing in `supabase/migrations/` does not mean it's been applied to production, always check `list_migrations` against the live project before assuming.

**Commits:**
- None — this was a direct Supabase MCP schema change, not a repo file change (the migration file was already committed). `BACKLOG.md` and this build-log entry still need a Claude Code commit.

**What's now operationally live:** Waitlist signups on `/design` (while `DESIGN_TOOL_LIVE` is off) will actually persist and trigger Steen's Resend notification, for the first time since both features were built.

**Parked / next:**
- The "email everyone when live" send-side gap (see BACKLOG.md) is still open, now that the table it depends on actually exists.

### 2026-07-26 (Sunday) — Drought/Heatwave content pair, cadence jump + reshuffle

**Active time:** ~1 hour

**Themes:** Steen flagged live news (eight UK water companies under Temporary Use Bans as of 23 July, Uisce Éireann's Water Conservation Order extended nationwide 24 July–26 August) as a genuine cadence-exception trigger. Researched, drafted, and scheduled two new Notes articles reactively, then reshuffled the already-queued Garden Cost / First-Time Owner satellites to keep the max-two-per-week cadence rule intact.

**Shipped:**
- Two new MDX articles drafted: `surviving-a-hosepipe-ban.mdx` (scheduled 27 July, during-the-restriction triage: priority watering order, UK/IE ban specifics with fines, US/AU terminology equivalents, RHS-sourced washing-up-water-vs-dishwasher-water distinction) and `reviving-your-garden-after-a-hosepipe-ban.mdx` (scheduled 30 July, dormant-vs-dead assessment, RHS 2–3 week recovery patience window, deep-vs-frequent watering guidance). Both carry citations (Uisce Éireann, RHS, BBC Gardeners' World, Iowa State Extension, Colorado State Extension, Water Victoria), FAQ blocks, Related Notes footers, and soft dedrab CTAs per house rules.
- New "Drought / Heatwave" cluster added to `docs/publishing-schedule.md` and `BACKLOG.md`, flagged explicitly as event-driven rather than a planned pillar build, with a review trigger (2–3 weeks of Search Console data) to decide whether it earns a proper pillar or stays a two-piece pair.
- Cadence exception written up in `docs/publishing-schedule.md`, mirroring the Bord Bia Bloom (4 June) and UK pillar (6 July) precedents.
- Reshuffled the three still-upcoming Garden Cost / First-Time Owner satellites back exactly one week each: Cheap Garden Ideas 28 Jul → 4 Aug, What Would My Garden Actually Look Like 4 Aug → 11 Aug, DIY or Hire a Landscaper 11 Aug → 18 Aug. "Where the Money Actually Goes" (21 July) had already gone live and was confirmed and back-filled into the Published Log, which had fallen behind.
- Hero image prompts provided for both new articles (see chat handoff), not yet generated.

**Commits:**
- Not yet committed — file edits made via Cowork, git add/commit/push still needs to run through Claude Code on Steen's machine.

**What's now operationally live:** Nothing yet — both MDX files and the schedule/backlog docs exist in the working tree only, pending commit + push + the usual ISR promotion once `publishedAt` arrives.

**Parked / next:**
- Internal-link retro-patch on the four cross-linked siblings (`low-maintenance-garden-ideas-by-climate.mdx`, `low-maintenance-garden-under-an-hour-a-week.mdx`, `plant-hardiness-zones-ireland-beginners-guide.mdx`, `what-planting-zone-is-the-uk-in.mdx`) — in progress this same session, should land in the same commit.
- Generate the two hero images from the prompts provided.
- Revisit the Drought/Heatwave cluster in 2–3 weeks against Search Console data to decide pillar-vs-pair.

### 2026-06-04 (Thursday evening) — CTR diagnosis + FAQ schema wiring

**Active time:** ~1 hour
**Wall-clock window:** ~14:30 – 15:30 UTC

**Themes:** First real Search Console diagnosis. The canonical fix paid off measurably (pillar at 287 impressions, avg position 9.3) but CTR was 0.3% — well below benchmark for page-1 ranking. Diagnosis pointed to Google's AI Overview / SGE absorbing factual zone-lookup queries before users click. Three-fix response shipped.

**Shipped:**
- **Pillar title rewrite.** "Plant Hardiness in Ireland: A Beginner's Guide to What the Ratings Actually Mean" → "Plant Hardiness Zones in Ireland: H1 to H7 Explained for 2026". Adds "zones" (top query word), "H1 to H7" (entity match), year freshness signal. Sized to fit Google's title display window.
- **Pillar description rewrite.** Now opens with the direct factual answer: "Ireland sits mostly in RHS hardiness zones H4 and H5 (roughly USDA Zone 8 to 9). A plain-English guide to what H1 to H7 mean and where on the map you actually sit." Designed as AI Overview citation bait.
- **Pillar quick-answer Callout** inserted at top of body so the direct factual answer is the first thing both readers and AI synthesisers encounter.
- **Pillar tags rewritten** to mirror actual Search Console queries: `plant hardiness zones ireland`, `hardiness zones ireland`, `what zone is ireland`, etc.
- **`hasFaq` was a no-op until today.** The frontmatter flag was set on two articles (pillar, landscaper) but the page renderer never emitted any FAQ JSON-LD. Wired the missing piece:
  - `extractFaq(content)` added to `src/lib/notes.ts`. Recognises both `## Frequently Asked Questions` and `## Questions to Ask ...` H2 sections, pulls every `### Question` + answer pair, strips markdown for clean JSON output.
  - `src/app/notes/[slug]/page.tsx` now emits FAQPage JSON-LD when `hasFaq: true` AND `extractFaq` finds Q&As. Both the hardiness pillar and the landscaper refresh now produce real schema.
- `updatedAt: 2026-06-04` set on the pillar so Google sees the refresh as recent.

**Commits:**
- (Pending Steen's terminal commit — sha to be filled in)

**Why these matter:**
- Title + description tuning addresses the 0.3% CTR for queries where AI Overview doesn't fire
- Quick-answer Callout addresses the queries where AI Overview DOES fire (gives it a clean factual sentence to cite)
- FAQ JSON-LD lets Google render rich expandable FAQ snippets in SERPs, which historically lift CTR meaningfully even when the page rank doesn't move

**What to watch next 7-14 days:**
- Pillar CTR — should climb from 0.3% toward 1-3%
- FAQ-rich-snippet appearance on the pillar queries (use SERP simulator or just google "what hardiness zone is ireland" anonymously)
- Whether vineyards + Bloom article pull their own impression share

**Parked / next:**
- Still no Search Console action on apex-URL reindexing (Google still working through it)
- Satellite 3 and /ask-a-landscaper landing page still held for data

---

### 2026-06-04 (Thursday afternoon) — Bord Bia Bloom 2026 commentary article

**Active time:** ~1.5 hours
**Wall-clock window:** ~13:00 – 14:30 UTC

**Themes:** Ride the Bord Bia Bloom 2026 search peak with a time-sensitive commentary piece. Bloom wrapped Monday 1 June; search interest crests this week and dies within 3 weeks. Cadence-exception write justified in the schedule doc.

**Shipped:**
- New article `src/content/notes/your-own-show-garden-bord-bia-bloom-2026.mdx`. ~1,300 words. Six principles worth stealing from this year's gardens, with real 2026 specifics: James Purdy's Recycled / Reused / Refilled garden (overall large), Joe Eustace's Future in Mind (overall medium + Designers' Choice), David Negus's Rooted in Resilience (People's Choice), Fingal CC's Nurturing Communities through Nature (Most Sustainable), Met Éireann's 90-year climate-resilience garden, Jack Donovan's Alltar (Cultivating Talent). Cited from Bord Bia Bloom, RTÉ, Irish Times, Garden Guide Ireland.
- 6 inline internal links pulling in pillar, small Irish garden guide, plants-that-earn-their-keep, pollinator-haven, low-maintenance, landscape-paralysis, where-to-begin. Heavy cross-cluster bridge.
- Retro-patched 3 sibling articles to add the new piece to their Related Notes blocks: small-irish-garden-design-guide, plants-that-earn-their-keep-temperate-garden, landscape-paralysis-why-great-gardens-dont-happen.
- Hero image prompt included as MDX comment (Steen to generate via Gemini Flash).
- `featured: true` set so it takes the hero slot on /notes index for the next couple of weeks.
- Publishing schedule updated with the cadence-exception rationale logged inline. Published log updated.

**Commits:**
- (Pending Steen's terminal commit — sha to be filled in)

**Notes for the test:** This is the first article to ship under the new ISR auto-publish system from earlier today. PublishedAt is set to today (2026-06-04). Worth re-curling after Vercel deploys to confirm the route materialises within the hour as designed.

**Parked / next:**
- Worth watching Search Console next week for whether "Bord Bia Bloom 2026" queries pull impressions.
- Satellite 3 and `/ask-a-landscaper` landing page still held for data.

---

### 2026-06-04 (Thursday morning) — Publishing audit + ISR auto-publish fix

**Active time:** ~1 hour
**Wall-clock window:** ~11:15 – 12:15 UTC

**Themes:** Audit the live publishing state vs schedule. Diagnose and fix the auto-publish gap.

**Shipped:**
- Curl audit of all cluster URLs uncovered both vineyards still 404 (Irish 9 days late, British 2 days late). Pillar and landscaper refresh confirmed live since 22 May.
- Canary verified healthy: heartbeat firing every minute, zero alerts in 12 days, `/api/health/inngest` returning `{healthy: true, age_seconds: 32}`.
- Root cause identified: `getNotesSlugParams()` filtered future-dated articles out of `generateStaticParams` at build time, so their static routes never existed. The per-page date check was correct but never reached.
- Permanent fix shipped in one PR:
  - `src/lib/notes.ts` — `getNotesSlugParams()` rewritten to return all non-draft slugs (date check moved to render-time, where it already lived in `getNotesPost`).
  - `src/app/notes/[slug]/page.tsx` — `export const revalidate = 3600` added so routes self-promote from 404 to 200 within ~1 hour of their `publishedAt` arriving.
  - `src/app/notes/page.tsx` — same revalidate so the Notes index refreshes hourly and lists newly-published articles automatically.
  - `src/app/notes/category/[cat]/page.tsx` — same revalidate for category routes.
  - `src/app/sitemap.ts` — same revalidate so Google picks up new URLs within an hour of go-live.
- Irish vineyard `publishedAt` bumped from 2026-05-26 → 2026-06-04 so Google indexes it as fresh content rather than 9-day-old back-dated.

**Commits:**
- (Pending Steen's terminal commit after this session — sha to be filled in)

**What's now operationally live (after the pending commit deploys):**
- Both vineyards 200, listed in `/notes`, included in sitemap, in the RSS feed.
- The plant label decoder (9 June) and RHS/USDA translator (16 June) will now auto-publish themselves on their dates without any human intervention — no manual redeploy needed each Tuesday.
- The cadence rule's auto-publish promise actually holds going forward.

**Parked / next:**
- Satellite 3 + `/ask-a-landscaper` landing page — still held for Search Console data.
- Worth checking next week whether the two newly-live vineyard articles have started pulling impressions.

---

### 2026-05-23 (Saturday) — Pipeline-health canary live + sweep cleanup

**Active time:** ~1.5 hours
**Wall-clock window:** ~09:30 – 12:00 UTC (intermittent across morning)

**Themes:** Get the pipeline-health canary deployed end-to-end. Finish editorial commits on the cluster work. Confirm canonical fix landed in Search Console.

**Shipped:**
- Search Console reindex requested on apex URLs from yesterday's canonical fix (Steen, dashboard).
- Editorial polish on `your-own-irish-vineyard.mdx` committed and pushed (Steen, terminal).
- Editorial polish on `what-do-plant-label-symbols-mean.mdx` committed and pushed (Steen, terminal).
- Pipeline-health canary fully live:
  - Migration `012_pipeline_health` applied to production Supabase via Supabase MCP.
  - Singleton row reset to NOW() to avoid the circuit-breaker tripping the moment code deployed.
  - Old lowercase `CRON_secret` env var deleted in Vercel.
  - New `CRON_SECRET` (all-caps, hex-32) added to Production + Preview + Development.
  - Cron schedule downgraded from `*/5 * * * *` to `0 9 * * *` (daily 09:00 UTC) to satisfy Vercel Hobby tier limits — captured in memory.
  - Commit `96dcc33` deployed to main; Vercel auto-deployed.
  - Inngest resynced; `heartbeatFunction` now firing every minute, verified via DB query (`age_seconds: 34`, zero failures).
- UptimeRobot 5-minute external monitor configured against `/api/health/inngest` to compensate for the daily-only Vercel cron alert lag.
- Memory: `project_dedrab_vercel_hobby_cron_limit.md` written. Future sessions won't suggest sub-daily Vercel crons on this project.

**Commits:**
- `96dcc33` — Downgrade heartbeat cron to daily (Hobby plan limit)
- (Plus Steen's two editorial polish commits — sha not captured)

**What's now operationally live:**
- Inngest heartbeat firing every minute, writing `last_seen_at` to `pipeline_health` singleton.
- Circuit-breaker in `/api/redesign` refuses paid submissions when heartbeat is >10 min stale, preserves invite code.
- Daily Vercel cron at 09:00 UTC checks freshness and emails `steen.gordon@gmail.com` if stale, with 30-min cooldown after first alert.
- UptimeRobot polling `/api/health/inngest` every 5 minutes as the real-time outage detector.

**Parked / next:**
- Satellite 3 (grandmother's garden) — held for vineyard Search Console data.
- `/ask-a-landscaper` landing page — held for `before-you-hire-a-landscaper` refresh data.
- Phase 1b progressive reveal — backlog.
- PDF fallback overwrite bug (`DED-202605-QRSQ`) — still open on backlog.

---

### 2026-05-22 (Friday) — Hardiness cluster shipped + canonical fix + retro-link sweep

**Active time:** ~8 hours
**Wall-clock window:** all day, with breaks

**Themes:** Build out the hardiness cluster from Search Console signal, lock SEO content strategy as an ongoing way of working, fix the canonical hostname split, retro-patch every published Notes article into the link graph.

**Shipped:**

*SEO strategy & cadence (process):*
- Three Notes rules locked in BACKLOG: every article links to 2–3 siblings; retro-patch siblings when a new one ships; every article has a soft dedrab CTA.
- `docs/publishing-schedule.md` created — one-per-Tuesday cadence rule, future cluster ideas, published log.
- Hardiness identified as the active cluster off the back of Search Console queries (rhs hardiness ratings, h4/h5 hardiness, etc.).
- "Ask a landscaper" identified as the lone high-intent commercial query in the data; strategy reframed to refresh existing `before-you-hire-a-landscaper` first before building a dedicated landing page.

*Content shipped:*
- Hardiness pillar refresh — `plant-hardiness-zones-ireland-beginners-guide.mdx`. New beginner-friendly opener, inline links to siblings, climate-change closing block, Related Notes (patched twice during the day), dedrab CTA.
- Irish vineyard article — `your-own-irish-vineyard.mdx`. Scheduled 2026-05-26. Real Irish vineyards + Met Éireann + Teagasc citations.
- British vineyard article — `your-own-british-vineyard.mdx`. Scheduled 2026-06-02. Real UK vineyards + Met Office Central England Temperature + WineGB citations.
- Satellite 1 — `what-do-plant-label-symbols-mean.mdx`. Scheduled 2026-06-09. Beginner-friendly decoder of plant pot labels.
- Satellite 2 — `rhs-hardiness-vs-usda-zones.mdx`. Scheduled 2026-06-16. Cross-Atlantic conversion table + drainage trap explanation.
- `before-you-hire-a-landscaper.mdx` refresh — "ask a landscaper" phrasing in intro + new FAQ block + `hasFaq: true` for JSON-LD schema + Related Notes + dedrab CTA.
- Retro-link sweep across 12 pre-existing Notes articles: every article now carries a Related Notes footer (4 cluster + cross-cluster links each), 1–3 inline contextual links in body prose, and a soft dedrab CTA.

*Canonical hostname fix:*
- Investigation found all in-code URL generation already used `https://www.dedrab.com`. The Search Console split was caused entirely by the missing apex → www 301 at the hostname layer.
- Code: `metadataBase: new URL('https://www.dedrab.com')` added to layout.tsx; host-based permanent 308 added to `next.config.ts` redirects().
- Platform: Vercel domains panel — `www.dedrab.com` set as production primary, `dedrab.com` apex set as Permanent (308) Redirect to www. First attempt landed on 307 (Vercel default) — flipped to 308 explicitly. Verified live via `curl -sI` returning `HTTP/2 308` and correct `location` header.

*Loop test (validated the standing rule):*
- Attempted full git loop from Cowork sandbox per past-me's commitment. Mapped exactly where it breaks: `git add` works (with warnings), `git commit` fails because the sandbox cannot unlink `.git/index.lock`. Memory updated — Cowork edits files, Claude Code commits.

**Commits:**
- `7da3f3b` — Notes: hardiness cluster — pillar refresh + UK/Irish vineyard pair + publishing schedule
- `ee47071` — Canonical hostname fix (code layer) — metadataBase + apex→www 301 in next.config
- `4791a8d` — Notes: repair British vineyard frontmatter + date format
- `6dd572a` — Notes: hardiness cluster satellites 1 + 2, landscaper refresh, vineyard hero images
- (Retro-link sweep commit — sha not captured in this conversation)
- (Steen's Irish vineyard editorial polish commit — sha not captured)

**Memory written or updated:**
- `feedback_notes_internal_linking.md`
- `project_notes_topical_cluster_strategy.md`
- `reference_publishing_schedule.md`
- `project_dedrab_canonical_hostname_split.md`
- `feedback_no_ai_hyphens.md`
- `feedback_git_via_claude_code.md` (rewrote with empirical validation)

**What's now operationally live:**
- 14 Notes articles in 5 interlinked clusters (hardiness, cost, getting-started, small-space, planting).
- 4 satellites pre-drafted and date-gated through 16 June via `publishedAt` filter.
- Canonical 308 enforced apex → www at Vercel edge + in-code safety net.
- Brand-voice rule on hyphens / em-dashes captured in memory.

**Parked / next:**
- Pipeline-health canary work (Steen's WIP) — picked up on 23 May.
- Search Console URL inspection on apex URLs — scheduled for 23 May.

---

## Pre-22 May 2026 — Bulk catch-up (approximate, drawn from BACKLOG and git history)

Detailed session logs start from 22 May 2026. The work below is reconstructed at lower fidelity from `BACKLOG.md` and `git log` — accurate but not exhaustive.

**Phase 1a customer safety net (live 12 May 2026):** Async email-on-completion via Inngest `save-design-record` and `email-plan-ready` steps. End-to-end verified with smoke test DED-202605-4YLY. Migration `011_pipeline_jobs_recipient_email.sql`, `/api/redesign` accepts userEmail, Inngest pipeline has two new final steps, `/api/design-record` returns full report, `/next-steps` hydrates sessionStorage from email link arrivals, `/design` loading screen reveals "we'll email you" reassurance after 60s.

**Pipeline output size fix (12 May 2026):** Refactored all Inngest steps that handled image buffers to persist PNGs to Supabase Storage inside the producing step and return only the storage path. Fixed silent kill at finalisation phase. Bumped `/api/inngest` maxDuration to 300s.

**Inngest re-sync + Cloudflare WAF fix (12 May 2026):** Inngest stopped processing events from 5 May because Cloudflare WAF was silently blocking `/api/inngest`. Added Cloudflare WAF custom rule skipping Bot Fight Mode + Managed Rules + Rate Limiting for `/api/inngest` path.

**GA CSP fix:** Widened CSP allowlist from `https://www.google-analytics.com` to `https://*.google-analytics.com` on script-src, script-src-elem, connect-src in `next.config.ts`. GA4 region endpoints were being blocked, killing event collection from ~2 May.

**Notes content system — first 8 articles published.** Pillar plus initial cluster: `plant-hardiness-zones-ireland-beginners-guide`, `low-maintenance-garden-ideas-by-climate`, `diy-garden-makeover-plan`, `pollinator-haven-garden-features`, `garden-drab-to-fab-weekend`, `hard-landscaping-vs-soft-landscaping`, `landscape-paralysis-why-great-gardens-dont-happen`, `making-small-gardens-feel-generous`, `plants-that-earn-their-keep-temperate-garden`, `where-to-begin-garden-redesign`, `small-irish-garden-design-guide`, `garden-design-cost-breakdown-2026`, `real-cost-of-redoing-a-small-garden`, `before-you-hire-a-landscaper`.

**Stripe payment flow reorder (7 May 2026):** `/design` as entry, `/next` (€4.95) before Gemini fires, selections preserved on return.

**Shared SiteHeader + WCAG AA footer contrast (2 May 2026).** Notes architecture locked at `www.dedrab.com/notes` (not subdomain).

**Sitemap submitted to Google Search Console (30 Apr 2026).**

**Stripe `/next` payment screen live (pre-30 Apr 2026).**

**Site infrastructure baseline (Mar 2026 → ):** Next.js 14 App Router + TypeScript + Tailwind, Vercel hosting, Cloudflare DNS + proxy, Supabase (Postgres + Storage + Auth), Resend for email, Inngest for async pipeline, Gemini Flash Image (nano-banana) for renders. Domain `dedrab.com` registered, project initialised on Vercel as `garden-genie`.

---

## Session entry template

Copy this block when adding a new entry, paste at the top of the Sessions section, fill in.

```markdown
### YYYY-MM-DD (Day) — Short title summing up the session

**Active time:** ~X hours
**Wall-clock window:** HH:MM – HH:MM (timezone)

**Themes:** One or two sentences on what the session was actually about.

**Shipped:**
- Bullet per concrete piece of work that landed.

**Commits:**
- `sha` — short commit message
- (List each, or "see git log between X and Y" if it was a lot)

**Memory written or updated:** (optional, only if any)
- `memory_file_name.md`

**What's now operationally live:** (optional, only on big ship days)
- Plain-English description of what users / Google / monitoring will now see differently.

**Parked / next:**
- Items that were touched but deliberately not finished, or rolled into the next session.
```

---

## 2026-10-07 — Cookie-free funnel tracking

**Goal:** First-party funnel analytics (site visits → /design → CTA clicks → /next → waitlist signups) with a headline panel on /admin/leads. No cookies, no IP storage, no identifiers.

**Branch:** `feat/funnel-tracking`

**Files created:**
- `supabase/migrations/015_site_events.sql` — source-control only (table already live in production)
- `src/app/api/track/route.ts` — POST endpoint, always responds 204; filters bots (UA regex), admin sessions, /admin and /api paths; parses referrer host/path, utm params; inserts into `site_events`
- `src/components/SiteTracker.tsx` — client component; tracks pageviews on path change (no cookies/storage); tracks "Build my Garden Plan" CTA clicks via document-level click listener; uses sendBeacon with fetch fallback
- `src/components/admin/FunnelStats.tsx` — async server component; 3-window funnel table (7d/30d/all-time) with conversion %; top 8 sources and /next referrer paths for last 30 days

**Files modified:**
- `src/app/layout.tsx` — import + mount `<SiteTracker />` after `<AnalyticsConsent />`
- `src/app/next/page.tsx` — `handleWaitlistSubmit` sends `source` field (referrer pathname if same-origin, else hostname, plus utm_source if present)
- `src/app/api/waitlist/route.ts` — accepts optional `source`, stored on new signups only (existing rows never overwritten)
- `src/app/admin/leads/page.tsx` — `<FunnelStats />` mounted above leads table

**Verification curls sent (all → 204, local dev / production table):**
```
POST /api/track  {"event":"pageview","path":"/__test","referrer":"https://www.google.com/"}        → 204 (stored)
POST /api/track  {"event":"pageview","path":"/__test_bot",...} UA: Googlebot                      → 204 (not stored)
POST /api/track  {"event":"invalid_event","path":"/__test"}                                        → 204 (not stored)
POST /api/track  {"event":"pageview","path":"/admin/leads"}                                        → 204 (not stored)
POST /api/track  {"event":"cta_build_plan","path":"/design"}                                       → 204 (stored)
GET  /admin/leads (unauthenticated)                                                                 → 307 to /admin/login ✓
```

**Cleanup needed in production DB:** delete from site_events where path = '/__test' or path = '/design' and created_at > '2026-10-07T00:00:00Z' and event = 'cta_build_plan' (the two stored test rows).

**Known pre-existing lint errors** (not introduced here): `no-explicit-any` in waitlist route (catch block), analyse route, redesign route, and others; `no-img-element` warnings in leads/login/landing pages.
