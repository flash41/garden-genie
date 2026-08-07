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
| 2026-06-23 (Tue) | New | Why the Plants in Your Grandmother's Garden Don't Always Survive Anymore (Satellite 3) | **Held — still overdue, bumped again by the UK pillar exception below** |
| 2026-06-30 (Tue) | Landing | `/ask-a-landscaper` landing page (sits outside `/notes`, not in Notes index) | **Held — refresh shipped first, wait on Search Console signal** |
| 2026-07-07 (Tue) | New | What Planting Zone Is the UK In? RHS H3 to H7 Explained (head-term pillar) | **Live 7 July** — jumped the queue ahead of Satellite 3, see exception note below |
| 2026-07-14 (Tue) | New | Designing a Garden You Can Actually Maintain in Under an Hour a Week | **Live 14 July** — time-budget companion to the low-maintenance-by-climate piece, normal cadence slot, no exception needed |
| 2026-07-21 (Tue) | New | Where the Money Actually Goes in a Mid-Size Garden Renovation (Garden Cost satellite) | **Live 21 July** — see cadence note below re: Satellite 3 slot conflict |
| 2026-07-27 (Mon) | New | Surviving a Hosepipe Ban: What Actually Works When You Can't Water the Garden (Drought/Heatwave, piece 1 of 2) | **Drafted 26 July, scheduled 27 July** — jumps the queue outright, see cadence exception below |
| 2026-07-30 (Thu) | New | Reviving Your Garden After a Hosepipe Ban: What Needs Help and What Doesn't (Drought/Heatwave, piece 2 of 2) | **Drafted 26 July, scheduled 30 July** — tightly related sibling to the 27 July piece, allowed within the same window per the cadence rule |
| 2026-08-04 (Tue) | New | Cheap Garden Ideas That Don't Look Cheap (Garden Cost satellite) | **Drafted 11 July** — bumped back one week from 28 July to make room for the drought pair, will auto-publish on schedule via ISR |
| 2026-08-11 (Tue) | New | What Would My Garden Actually Look Like? Seeing Before You Spend (First-Time Garden Owner satellite) | **Drafted 11 July** — bumped back one week from 4 August, will auto-publish on schedule via ISR |
| 2026-08-18 (Tue) | New | DIY or Hire a Landscaper? How to Actually Decide (First-Time Garden Owner satellite) | **Drafted 11 July** — bumped back one week from 11 August, will auto-publish on schedule via ISR |
| 2026-08-25 (Tue) | New | Drought-Tolerant and Water-Wise Planting (Drought/Heatwave cluster, evergreen pillar candidate) | **Queued 5 Aug** — target date, not yet drafted |
| 2026-09-01 (Tue) | New | Microclimates in Your Garden (Hardiness satellite) | **Queued 5 Aug** — target date, not yet drafted |
| 2026-09-08 (Tue) | New | Gravel vs Decking vs Paving (Comparison cluster) | **Queued 5 Aug** — target date, not yet drafted |
| 2026-09-15 (Tue) | New | Boggy or Waterlogged Garden — What to Do (Problem-solving cluster) | **Queued 5 Aug** — target date, not yet drafted |
| 2026-09-22 (Tue) | New | Last Frost Dates and How to Use Them for Planting Timing (Hardiness satellite) | **Queued 5 Aug** — target date, not yet drafted |
| 2026-09-29 (Tue) | New | Native vs Non-Native Planting (Comparison cluster) | **Queued 5 Aug** — target date, not yet drafted |
| 2026-10-06 (Tue) | New | What Will Actually Grow in a North-Facing Garden (Problem-solving cluster) | **Queued 5 Aug** — target date, not yet drafted |
| 2026-10-13 (Tue) | New | Coastal and Exposed Garden Planting (Hardiness satellite) | **Queued 5 Aug** — target date, not yet drafted |
| 2026-10-20 (Tue) | New | Raised Beds vs In-Ground Beds (Comparison cluster) | **Queued 5 Aug** — target date, not yet drafted |
| 2026-10-27 (Tue) | New | Clay Soil vs Sandy Soil — What'll Grow (Problem-solving cluster) | **Queued 5 Aug** — target date, not yet drafted |
| 2026-11-03 (Tue) | New | Landscaping a Sloped Garden (Problem-solving cluster) | **Queued 5 Aug** — target date, not yet drafted |

### ISR fix — 4 June 2026

The original date-gating was build-time only — future-dated articles never had their static routes generated and stayed 404 even after their `publishedAt` arrived. Audit on 4 June found both vineyards stranded (Irish 9 days late, British 2 days late). Fix shipped same day:

- `getNotesSlugParams()` in `src/lib/notes.ts` now returns all non-draft slugs regardless of date, so future articles enter the static route table at build time.
- Per-page `getNotesPost(slug)` still returns null for future-dated posts, so the page handler renders 404 until the date passes.
- `export const revalidate = 3600` added to `[slug]/page.tsx`, `notes/page.tsx`, `notes/category/[cat]/page.tsx`, and `sitemap.ts`. Future articles auto-promote from 404 to 200 within ~1 hour of their `publishedAt` arriving.

From here on the cadence rule's "auto-publish on date" promise actually holds without manual redeploys.

### Cadence exception — Bord Bia Bloom commentary, 4 June 2026

`your-own-show-garden-bord-bia-bloom-2026.mdx` ships out of normal Tuesday cadence (published Thu 4 June rather than Tue 9 June). Per the published exception rule, this is a time-sensitive event piece: Bord Bia Bloom 2026 wrapped on 1 June, search interest peaks in the week after, and waiting until Tue 9 June would catch the tail of that wave instead of the crest. Plant label decoder (Satellite 1) remains on its 9 June slot unchanged — that's two articles in a 5-day window, allowed by the cadence rule when the second is reinforcing a separate signal. Going forward, normal Tuesday cadence resumes.

### Cadence exception — UK hardiness pillar jumps the queue, 6 July 2026

Head-term strategy session (6 July, see `BACKLOG.md` SEO content strategy section) confirmed the single biggest gap in Search Console: Ireland pulls 1,207 impressions at position 8.9, the UK (our stated first market) pulls only 193 at position 15.1, and no UK-equivalent pillar exists. With the site's overall impressions about to cross the ~400/wk head-term threshold, this gap was judged too costly to leave queued behind Satellite 3, which has already slipped twice (26 May → 4 June → held) and has no confirmed publish window. Decision: `what-planting-zone-is-the-uk-in.mdx` takes the 7 July Tuesday slot outright. Satellite 3 (grandmother's garden) stays held with no new target date — it gets written once the UK pillar and its cross-links have had 2–3 weeks in Search Console. Normal Tuesday cadence resumes after 7 July.

### Cadence note — Garden Cost and First-Time Garden Owner clusters promoted, 11 July 2026

Conversion-first content session (see `BACKLOG.md` SEO content strategy section) concluded that "plant hardiness zones ireland", the site's strongest ranking signal, is a poor conversion audience, top-of-funnel research traffic rather than someone about to touch the tool. Four satellites agreed across two clusters that were sitting in "Future Cluster Ideas" below, both promoted to Active here on conversion-intent grounds rather than the stated Search Console activation trigger (neither cluster has hit 5+ impressions/week on 2+ queries yet), flagged explicitly as a deliberate override, not a quiet rule change. They take the 21 & 28 July and 4 & 11 August Tuesday slots.

This creates a scheduling conflict: Satellite 3 (grandmother's garden, Hardiness cluster) was provisionally eligible for the 21 or 28 July slot once the UK pillar had 2–3 weeks of Search Console data. Defaulting to the Garden Cost satellites taking those two slots, since better conversion is the explicit reason this work was commissioned, but Steen should resequence if Satellite 3 should jump back in front of the queue.

### Cadence exception — hosepipe ban drought pair jumps the queue, 26 July 2026

Genuinely live news, not a manufactured hook: as of 23 July, eight UK water companies (covering Kent, Hampshire and the Isle of Wight, East Anglia, Devon, Cambridgeshire, London and the Thames Valley, Affinity's Central region, and parts of west Wales) have a Temporary Use Ban in force, and Uisce Éireann extended its Water Conservation Order nationwide from 24 July to 26 August. Search interest in hosepipe bans, watering restrictions and drought garden care is at its peak right now, not in two or three weeks when the next normal cadence slot would come round. Per the same exception rule used for Bord Bia Bloom (4 June) and the UK pillar (7 July): this is judged too time-sensitive to queue behind the Garden Cost cluster.

Two new pieces, `surviving-a-hosepipe-ban.mdx` and `reviving-your-garden-after-a-hosepipe-ban.mdx`, ship 27 and 30 July, a 3-day gap mirroring the Bord Bia Bloom precedent of an event piece followed shortly by a tightly related sibling. That's two articles in a window that would otherwise also contain the already-queued Cheap Garden Ideas satellite (28 July) — three in seven days breaches the cadence rule outright, so rather than stack all three, the three remaining queued satellites (Cheap Garden Ideas, What Would My Garden Actually Look Like, DIY or Hire a Landscaper) each slide back exactly one week. Normal Tuesday cadence resumes 4 August.

---

## Active Cluster: Hardiness

**Pillars:** `plant-hardiness-zones-ireland-beginners-guide.mdx` (Ireland, refreshed 22 May 2026) and `what-planting-zone-is-the-uk-in.mdx` (UK, live 7 July 2026 — second pillar in the cluster, added to close the UK impressions gap identified in the 6 July strategy session)

**Satellites — in publishing order:**

1. Your Own Irish Vineyard (climate-change viral hook, Irish-fronted) — **drafted, scheduled 26 May**
2. Your Own British Vineyard (climate-change viral hook, UK-fronted) — **drafted, scheduled 2 June**
3. What Do the Symbols on Your Plant Label Actually Mean? (beginner-friendly label decoder) — **drafted, scheduled 9 June**
4. RHS Hardiness vs USDA Zones (cross-market translator) — **drafted, scheduled 16 June**
5. Why the Plants in Your Grandmother's Garden Don't Always Survive Anymore (emotional climate-shift hook) — **held, no target date**, bumped twice by the Bord Bia Bloom exception and the UK pillar exception; write once the UK pillar has 2–3 weeks of Search Console data

Every satellite links inline to both pillars. The UK pillar cross-links to the Ireland pillar, the British vineyard piece, and the RHS-vs-USDA translator; all three of those were retro-patched on 6 July to link back to the UK pillar in the same commit, per the internal linking rule.

## Active Cluster: Low Maintenance (time-budget companion)

`low-maintenance-garden-ideas-by-climate.mdx` (live 15 May) already covers the plant and structural choices by climate zone. `low-maintenance-garden-under-an-hour-a-week.mdx` (drafted 6 July, scheduled 14 July) approaches the same underlying problem from a different angle: a concrete weekly time budget instead of a climate lens, with an honest breakdown of what actually costs time and what doesn't fit the budget regardless of design. The two pieces cross-link each other and both link to `garden-drab-to-fab-weekend.mdx` and `diy-garden-makeover-plan.mdx`, which were retro-patched in the same commit.

## Active Cluster: Landscaper / Conversion

Triggered by Search Console signal — `before-you-hire-a-landscaper.mdx` was pulling 13 impressions/week with no optimisation. Strategy: refresh existing piece first, build dedicated landing page only if data warrants it.

- `before-you-hire-a-landscaper.mdx` refresh — **drafted 22 May**, ships immediately as a refresh (not a cadence slot).
- `/ask-a-landscaper` landing page — **held**, wait 2–3 weeks after refresh ships to see whether the existing article alone captures the intent, before deciding whether the landing page is additive or duplicative.

## Active Cluster: Garden Cost (conversion-first, promoted 11 July)

**Pillars:** `garden-design-cost-breakdown-2026.mdx` (live 12 May, multi-market banded ranges) and `real-cost-of-redoing-a-small-garden.mdx` (live 28 April, cost-buckets framework).

**Satellites — in publishing order:**

1. Where the Money Actually Goes in a Mid-Size Garden Renovation (single worked example, percentage-of-budget breakdown so it stays market-neutral) — **drafted 11 July, scheduled 21 July**
2. Cheap Garden Ideas That Don't Look Cheap (budget-conscious, design-led, Pinterest-friendly) — **drafted 11 July, scheduled 28 July**

Both satellites link inline to both pillars and to `before-you-hire-a-landscaper.mdx` / `diy-garden-makeover-plan.mdx` where relevant. Both pillars get retro-patched with links to the new satellites in the same commit each ships, per the internal linking rule. Full briefs (search intent, internal links, CTA, hero image direction) live in `BACKLOG.md` under "Garden Cost Cluster".

## Active Cluster: Drought / Heatwave (event-driven, added 26 July)

No dedicated pillar yet — this cluster opened reactively off live water-restriction news rather than a planned pillar-and-satellite build, unlike every other Active cluster above. Revisit after both pieces have had 2–3 weeks in Search Console: if "hosepipe ban" / "watering restrictions" terms sustain traffic beyond this news cycle, promote to a proper pillar; if it was a one-event spike, leave as a two-piece pair and archive the learning in `BACKLOG.md`.

**Pieces — in publishing order:**

1. Surviving a Hosepipe Ban: What Actually Works When You Can't Water the Garden (during-the-restriction triage: priority watering order, greywater safety, UK/IE/US/AU terminology) — **drafted 26 July, scheduled 27 July**
2. Reviving Your Garden After a Hosepipe Ban: What Needs Help and What Doesn't (after-the-restriction recovery: dormant vs dead, lawn reseeding, deep watering) — **drafted 26 July, scheduled 30 July**

Both pieces cross-link each other and link out to `low-maintenance-garden-ideas-by-climate.mdx`, `low-maintenance-garden-under-an-hour-a-week.mdx`, and both Hardiness pillars (`plant-hardiness-zones-ireland-beginners-guide.mdx`, `what-planting-zone-is-the-uk-in.mdx`). Those four get retro-patched to link back to the drought pair in the same commit, per the internal linking rule.

## Active Cluster: First-Time Garden Owner (conversion bridge, promoted 11 July)

**Pillars:** `landscape-paralysis-why-great-gardens-dont-happen.mdx` (live 26 April, names the decision-paralysis problem) and `where-to-begin-garden-redesign.mdx` (live 28 April, gives a starting framework).

**Satellites — in publishing order:**

1. What Would My Garden Actually Look Like? Seeing Before You Spend (visualisation angle, closest content-to-product mapping in the library) — **drafted 11 July, scheduled 4 August**
2. DIY or Hire a Landscaper? How to Actually Decide (decision framework, bridges DIY / Landscaper / First-Time clusters) — **drafted 11 July, scheduled 11 August**

Satellite 1 also links to `garden-drab-to-fab-weekend.mdx`; Satellite 2 also links to `diy-garden-makeover-plan.mdx`, `before-you-hire-a-landscaper.mdx`, and `garden-design-cost-breakdown-2026.mdx`. All linked pillars and siblings get retro-patched in the same commit each satellite ships. Full briefs live in `BACKLOG.md` under "First-Time Garden Owner Cluster".

---

## Future Cluster Ideas

Hold off building these until Search Console gives a signal that the underlying theme is worth chasing, or until a future conversion-first session promotes it early the way the Garden Cost and First-Time Garden Owner clusters were promoted on 11 July. Adding here so we don't lose the thought.

- **Small garden cluster** — built around existing `making-small-gardens-feel-generous.mdx` and `small-irish-garden-design-guide.mdx`. Possible satellites: "How to fake space in a courtyard garden", "Small garden mistakes that make spaces feel smaller", "Designing a 5x5m garden". **Action flagged 5 Aug:** `small-irish-garden-design-guide.mdx` is only pulling 17 impressions and its title/URL breaks the market-neutral rule — rename to drop "Irish" when this cluster is built rather than spin up a competing piece.

### Queued from GSC pages review, 5 August 2026

Search Console's top-pages report confirms the Hardiness cluster is the strongest performer and that comparison-format ("X vs Y") and practical-problem articles convert impressions to clicks at a better rate than pure guides. These now have provisional target dates in the Cadence Calendar (25 Aug – 3 Nov), deliberately interleaved across clusters rather than run back to back, same "build by cluster, ship by week" logic as everything above. Order and dates are provisional, not commitments — they'll slip the same way everything else in this document has slipped for genuinely time-sensitive work (events, refreshes, higher-priority conversion pieces).

Sequencing logic: drought-tolerant planting goes first (25 Aug) to catch residual search interest from the hosepipe ban news cycle before it fades; Hardiness satellites are spaced every 4 weeks to reinforce the strongest-performing cluster without diluting it; comparison and problem-solving pieces fill the gaps between.

- **Hardiness cluster — climate/microclimate satellites** (extends the existing pillars, no new cluster needed):
  - Microclimates in Your Garden — frost pockets, sun traps, why two spots in the same garden behave differently
  - Last Frost Dates and How to Use Them for Planting Timing
  - Coastal and Exposed Garden Planting — wind and salt tolerance

- **Drought/Heatwave cluster — evergreen pillar candidate:** Drought-Tolerant and Water-Wise Planting. This is the non-event-tied companion to the hosepipe ban pair — per the cluster's own note above, if "hosepipe ban"/"watering restrictions" traffic sustains past this news cycle, this is the piece to promote the cluster with, rather than leaving it as a two-piece event pair.

- **New cluster idea — Comparison format** (`hard-landscaping-vs-soft-landscaping.mdx` already shows this format holds attention; worth building out deliberately):
  - Gravel vs Decking vs Paving
  - Native vs Non-Native Planting
  - Raised Beds vs In-Ground Beds

  Note: "DIY vs hire a landscaper" is already covered — that's the First-Time Garden Owner cluster's Satellite 2, scheduled 11 August. No duplicate needed.

- **New cluster idea — Practical problem-solving** (same intent shape as the hosepipe ban pieces: a reader with a specific garden headache, not browsing):
  - Boggy or Waterlogged Garden — What to Do
  - What Will Actually Grow in a North-Facing Garden
  - Clay Soil vs Sandy Soil — What'll Grow
  - Landscaping a Sloped Garden

Activation rule: a cluster gets promoted from "Future" to "Active" when one of its existing articles starts pulling 5+ impressions per week on at least two related queries in Search Console, or when a conversion-first strategy session promotes it early with a written reason (see 11 July precedent above).

---

## Published Log

Most recent first. The log lives here so we can scan cadence at a glance without opening every MDX file.

| Publish Date | Title | URL |
|--------------|-------|-----|
| 2026-07-21 | Where the Money Actually Goes in a Mid-Size Garden Renovation | /notes/where-the-money-goes-in-a-garden-renovation |
| 2026-07-14 | Designing a Garden You Can Actually Maintain in Under an Hour a Week | /notes/low-maintenance-garden-under-an-hour-a-week |
| 2026-07-07 | What Planting Zone Is the UK In? RHS H3 to H7 Explained | /notes/what-planting-zone-is-the-uk-in |
| 2026-06-16 | RHS Hardiness vs USDA Zones: A Quick Translator | /notes/rhs-hardiness-vs-usda-zones |
| 2026-06-09 | What Do the Symbols on Your Plant Label Actually Mean? | /notes/what-do-plant-label-symbols-mean |
| 2026-06-04 | Your Own Show Garden: How to Steal the Best Ideas From Bord Bia Bloom 2026 | /notes/your-own-show-garden-bord-bia-bloom-2026 |
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
