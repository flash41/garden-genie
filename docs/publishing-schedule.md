# Dedrab Notes — Publishing Schedule

A living document. Update whenever an article is queued, drafted, scheduled, or published. Commit changes in the same PR as the article work.

---

## Why Cadence Matters

Dumping content onto the site does three things wrong:

1. **Crawl budget.** Google indexes new URLs over time. A flood gets partially indexed, partially queued, partially skipped — the slowest pieces can wait weeks for first impression.
2. **Quality signals.** Sudden bursts look like content farming to algorithmic quality signals; steady cadence reads as a healthy, maintained site.
3. **Feedback loop.** Each article needs 2–4 weeks in Search Console before we know what's working. Slow shipping means we learn from each piece before writing the next.

The strategy is: **build by cluster, ship by week.** A cluster might have five articles in it, but they go live one Tuesday at a time, not in a batch.

---

## The Cadence Rule

**One Notes article per week. Tuesdays. Maximum two in any seven-day window** (and only when the second is a tightly related sibling and the first piece's audience benefits from immediate cross-referral).

If a cluster needs more pieces than that allows, we queue and stagger. Cluster articles published in batch dilute the topical signal; staggered, they reinforce each other as Google sees the site returning to the same theme repeatedly.

### Publishing Day

**Tuesdays.** Best balance of weekly traffic peaks and indexer attention. We do not publish on weekends — weekend search traffic is hobbyist and casual; weekday traffic carries intent and converts.

### Refreshes vs new articles

Refreshing an existing article (the pillar refresh, for example) does **not** consume a Tuesday slot. Refreshes can ship any day — they keep the original `publishedAt` so the URL doesn't re-enter the index as new content.

---

## How to Update This Document

Whenever an article moves stage:

- **Planned** → add to "Queued" with working title and target publish date.
- **Drafted** → move to "In draft" with the file path.
- **Scheduled** → keep in "In draft" with confirmed publish date.
- **Published** → move to "Published log" with live URL and date.

Every change to this document is committed in the same PR as the article work it relates to.

---

## Cadence Calendar

| Date | Slot | Article | Status |
|------|------|---------|--------|
| 2026-05-22 (Fri) | Refresh | Plant hardiness pillar | Live since 22 May |
| 2026-05-22 (Fri) | Refresh | Before You Hire a Landscaper | Live since 22 May |
| 2026-06-02 (Tue) | New | Your Own British Vineyard (Satellite 4b) | **Live after 4 June deploy** (2 days late — build-time stale, fixed via ISR same deploy) |
| 2026-06-04 (Thu) | New | Your Own Irish Vineyard (Satellite 4a) | **Live after 4 June deploy** (originally 26 May; date bumped to 4 June because the build-time gate stranded it for 9 days — see ISR fix below) |
| 2026-06-09 (Tue) | New | What Do the Symbols on Your Plant Label Actually Mean? (Satellite 1) | Drafted — will auto-publish on schedule via ISR |
| 2026-06-16 (Tue) | New | RHS Hardiness vs USDA Zones — A Quick Translator (Satellite 2) | Drafted — will auto-publish on schedule via ISR |
| 2026-06-23 (Tue) | New | Why the Plants in Your Grandmother's Garden Don't Always Survive Anymore (Satellite 3) | **Held — write after vineyard data lands** |
| 2026-06-30 (Tue) | Landing | `/ask-a-landscaper` landing page (sits outside `/notes`, not in Notes index) | **Held — refresh shipped first, wait on Search Console signal** |

### ISR fix — 4 June 2026

The original date-gating was build-time only — future-dated articles never had their static routes generated and stayed 404 even after their `publishedAt` arrived. Audit on 4 June found both vineyards stranded (Irish 9 days late, British 2 days late). Fix shipped same day:

- `getNotesSlugParams()` in `src/lib/notes.ts` now returns all non-draft slugs regardless of date, so future articles enter the static route table at build time.
- Per-page `getNotesPost(slug)` still returns null for future-dated posts, so the page handler renders 404 until the date passes.
- `export const revalidate = 3600` added to `[slug]/page.tsx`, `notes/page.tsx`, `notes/category/[cat]/page.tsx`, and `sitemap.ts`. Future articles auto-promote from 404 to 200 within ~1 hour of their `publishedAt` arriving.

From here on the cadence rule's "auto-publish on date" promise actually holds without manual redeploys.

---

## Active Cluster: Hardiness

**Pillar:** `plant-hardiness-zones-ireland-beginners-guide.mdx` (refreshed 22 May 2026, Related Notes patched twice in 22 May commits)

**Satellites — in publishing order:**

1. Your Own Irish Vineyard (climate-change viral hook, Irish-fronted) — **drafted, scheduled 26 May**
2. Your Own British Vineyard (climate-change viral hook, UK-fronted) — **drafted, scheduled 2 June**
3. What Do the Symbols on Your Plant Label Actually Mean? (beginner-friendly label decoder) — **drafted, scheduled 9 June**
4. RHS Hardiness vs USDA Zones (cross-market translator) — **drafted, scheduled 16 June**
5. Why the Plants in Your Grandmother's Garden Don't Always Survive Anymore (emotional climate-shift hook) — **held**, write after vineyard pieces have 2+ weeks of Search Console data

Every satellite links inline to the pillar at least twice. The pillar's Related Notes footer was patched on 22 May to include all four currently-drafted satellites so cluster cross-links resolve when each goes live.

## Active Cluster: Landscaper / Conversion

Triggered by Search Console signal — `before-you-hire-a-landscaper.mdx` was pulling 13 impressions/week with no optimisation. Strategy: refresh existing piece first, build dedicated landing page only if data warrants it.

- `before-you-hire-a-landscaper.mdx` refresh — **drafted 22 May**, ships immediately as a refresh (not a cadence slot).
- `/ask-a-landscaper` landing page — **held**, wait 2–3 weeks after refresh ships to see whether the existing article alone captures the intent, before deciding whether the landing page is additive or duplicative.

---

## Future Cluster Ideas

Hold off building these until Search Console gives a signal that the underlying theme is worth chasing. Adding here so we don't lose the thought.

- **Garden cost cluster** — built around existing `garden-design-cost-breakdown-2026.mdx` and `real-cost-of-redoing-a-small-garden.mdx`. Possible satellites: "What does a garden designer actually charge?", "Where the money goes in a £10k garden", "Cheap garden ideas that don't look cheap".
- **Small garden cluster** — built around existing `making-small-gardens-feel-generous.mdx` and `small-irish-garden-design-guide.mdx`. Possible satellites: "How to fake space in a courtyard garden", "Small garden mistakes that make spaces feel smaller", "Designing a 5x5m garden".
- **First-time garden owner cluster** — built around existing `where-to-begin-garden-redesign.mdx` and `landscape-paralysis-why-great-gardens-dont-happen.mdx`. Possible satellites: "What to do with a garden you just inherited", "Reading your garden before you change it", "The first thing to plant in a new garden".

Activation rule: a cluster gets promoted from "Future" to "Active" when one of its existing articles starts pulling 5+ impressions per week on at least two related queries in Search Console.

---

## Published Log

Most recent first. The log lives here so we can scan cadence at a glance without opening every MDX file.

| Publish Date | Title | URL |
|--------------|-------|-----|
| 2026-06-04 | Your Own Irish Vineyard | /notes/your-own-irish-vineyard |
| 2026-06-02 | Your Own British Vineyard | /notes/your-own-british-vineyard |
| 2026-05-22 | DIY Garden Makeover Plan | /notes/diy-garden-makeover-plan |
| 2026-05-15 | Low Maintenance Garden Ideas by Climate Zone | /notes/low-maintenance-garden-ideas-by-climate |
| 2026-05-08 | Plant Hardiness in Ireland: A Beginner's Guide | /notes/plant-hardiness-zones-ireland-beginners-guide |
| 2026-05-07 | 8 Features That Turn a Garden Into a Pollinator Haven | /notes/pollinator-haven-garden-features |
| 2026-05-06 | How Would I Get Me Garden From Drab to Fab? | /notes/garden-drab-to-fab-weekend |
| 2026-05-01 | Before You Hire a Landscaper | /notes/before-you-hire-a-landscaper |
| (earlier) | Other articles in `/src/content/notes/` | |

---

## Notes on the Strategy Itself

- This document is reviewed at the end of each completed cluster. If a cluster underperforms in Search Console after 6 weeks of all satellites live, we change tack rather than push more articles into a dead theme.
- The "ask a landscaper" page is intentionally outside the `/notes` index — it's a conversion landing page, not a Notes article. It still follows the publishing schedule discipline because it competes for crawl budget the same way.
- If a topical opportunity appears that's too time-sensitive to wait for its Tuesday slot (e.g. an article tied to a specific event), we can break the cadence rule but only with a written reason in the commit message. Default is: hold the line.
