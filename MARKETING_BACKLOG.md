# Dedrab Marketing Backlog — Content & Distribution

A living, cross-session list of queued and recommended **content and distribution** work.
Its job is to outlast any single working session: if it's a marketing move we've agreed,
parked, or that I've recommended, it lives here so nothing falls through the cracks.

**Last compiled:** 6 September 2026. Updated 7 October 2026 (catch-up: 13 articles drafted, pin sets in `docs/pins/`, small-garden rename done; robots.txt/Bing/Pinterest account steps need Steen — see end of file).

---

## How this file relates to the others

Three documents, three jobs — kept separate so they don't drift:

- **`docs/publishing-schedule.md`** — owns the **article cadence**: the Tuesday calendar,
  cluster structure, publish log, and the cadence rules. That is the single source of truth
  for *when each Notes article ships*. This file does **not** restate that calendar.
- **`BACKLOG.md`** — owns the **SEO content strategy detail** (full article briefs, Search
  Console data snapshots, the reliability programme, product work).
- **`MARKETING_BACKLOG.md`** (this file) — the **marketing view**: distribution and
  amplification of what we publish, indexing/AEO plumbing, measurement, and net-new
  content angles not yet on the calendar. It points at the other two rather than copying them.

Scope by agreement (6 Sep 2026): **content + distribution only**. Email nurture, paid
media, partnerships and brand identity are deliberately out of scope for now — a couple are
noted at the bottom as "parked / out of scope" so we don't lose them.

Legend: `[ ]` open · `[~]` in progress / held · `[x]` done · **(REC)** = my recommendation,
not yet agreed — accept, reshape, or bin.

---

## Guardrails (apply to every item below)

These are the standing rules any content or distribution work has to pass:

1. **Markets, in order: UK first, Ireland second, US third** (AUS + rest-of-world welcome).
   Keep everything market-neutral — no region-specific pricing, currency symbols, legislation
   or plant zones in titles or framing unless a piece is explicitly market-targeted. Where
   regional flavour is unavoidable, frame it as observation, not prescription.
2. **Brand voice is warm, customer-facing, benefit-led, second person.** Lead with what the
   reader gets, not the feature. Soft builder presence ("we have tried to ensure"), not
   authority claims. Full spec in memory: *Dedrab brand voice*. This applies to **all**
   customer-facing surfaces — Notes, pins, social, product copy — not just articles.
3. **Every article ends by leading the reader toward trying the Dedrab Garden design engine** —
   in context, soft, never a pop-up or hard sell. The tool is the destination of the funnel.
4. **Never overpromise.** No claims of authority or guaranteed outcomes; frame experience as
   "what we've found" only when it's actually experience.
5. **Cadence discipline holds for distribution too.** Amplification shouldn't turn a steady,
   healthy-looking site into a spike-and-silence pattern.

---

## 1. Content pipeline — pointer + net-new angles

The live article queue (drafted, scheduled, queued through ~Nov 2026) lives in
`docs/publishing-schedule.md`. **Check there first** for anything cadence-related.

Items below are content angles that are **not yet on that calendar** — either raised and not
scheduled, or recommended by me.

- [x] **"Right plant, right place" — orientation-led planting article.** Now scheduled:
  slotted into `docs/publishing-schedule.md` for **10 Nov 2026** (next free Tuesday) as a
  Hardiness-cluster satellite. Angle: how the direction a garden faces (north/south/east/west)
  determines what thrives where; sun/shade mapping across the day and seasons. Pairs with the
  North-Facing (6 Oct) and Microclimates (1 Sep) pieces; strong natural CTA — translating
  orientation into a planting plan is exactly what Dedrab does. Not yet drafted.
- [x] **Rename `small-irish-garden-design-guide.mdx` to drop "Irish"** — DONE 7 Oct 2026 (now `small-garden-design-guide`, 301 redirect in next.config.ts). Original note: when the Small Garden
  cluster is built — the current title/URL breaks the market-neutral rule and it's only pulling
  ~17 impressions. Flagged in publishing-schedule.md; tracked here as a live market-neutrality fix.
- [ ] **Future clusters** (held in publishing-schedule.md until Search Console signals, or a
  conversion-first session promotes them): Small Garden, Comparison format (Gravel vs Decking
  vs Paving, Native vs Non-Native, Raised vs In-Ground), Practical problem-solving (waterlogged,
  north-facing, clay vs sandy, sloped), and the Drought/Heatwave evergreen pillar
  (Drought-Tolerant & Water-Wise Planting). Listed here only as a reminder — the schedule owns them.
- [ ] **(REC) Content refresh loop.** Add a standing quarterly pass: re-open the 3–4
  best-performing articles in Search Console, refresh with new sections/FAQs, keep the original
  `publishedAt`. Refreshes don't consume a Tuesday slot and reliably lift existing rankings
  faster than net-new pieces. Cheapest marketing win we have.
- [ ] **(REC) "Linkbait" angle for digital PR.** The climate-change vineyard pieces (Irish/British)
  are already the most shareable thing in the library. Consider one deliberately
  press-pitchable data-led piece per quarter (e.g. "How much has your growing zone shifted in
  20 years?") built to earn backlinks, not just rank. Ties into the outreach item in §2.

---

## 2. Distribution & amplification

How each published piece actually reaches people. This is the half of marketing the site has
least of right now — good content, thin distribution.

### Pinterest (agreed channel)
- [ ] **Per-article pin set at publish time.** Every Notes article ships with a set of pins
  (multiple angles, not one). Pinterest is visual-search and the product is inherently visual —
  before/after gardens are ideal pin fodder. **Action:** make "create pin set" a standard step
  in the article publish checklist, same PR discipline as internal linking.
- [ ] **Pin copy in brand voice.** Titles + descriptions use the customer-facing voice, not
  keyword-stuffed SEO register. Thread keywords through warm, spoken-register copy. (Memory:
  *Pinterest copy uses brand voice*.)
- [ ] **(REC) Board structure.** Set up themed boards mirroring the content clusters (Hardiness,
  Small Gardens, Costs, Low-Maintenance, Before/After). Cluster boards reinforce topical
  authority on Pinterest the same way internal linking does on-site.
- [ ] **(REC) Steady pinning cadence** rather than dumps — a few pins a week beats a batch,
  same healthy-signal logic as the article cadence.

### Other social (recommended — not yet agreed)
- [ ] **(REC) Short-form before/after video** (Reels / TikTok / YouTube Shorts). The tool's
  core mechanic — photo in, redesign out — is a native fit for the before/after format that
  performs best on these platforms. Highest-upside untapped channel. Start with 3–4 test clips
  from existing example renders before committing.
- [ ] **(REC) Instagram** as the home for the visual before/after library + carousel versions
  of the most visual articles (Cheap Garden Ideas, What Would My Garden Look Like).
- [ ] **(REC) Gardening communities** (Reddit r/gardening, r/GardeningUK; Houzz; Gardeners'
  World forums). Genuinely useful answers that link to a relevant article where it fits —
  never drive-by promotion. Slow, credibility-based, but high-intent.
- [ ] **(REC) Digital PR / outreach** for the linkbait pieces (see §1). Pitch the vineyard /
  zone-shift angles to gardening press and local outlets in target markets.

### AEO — being surfaced in AI answers (agreed direction)
- [ ] **Cloudflare robots.txt → Content Signals Policy** — unblock GPTBot, Google-Extended,
  Applebot-Extended so our content is eligible to surface in AI/LLM answers. (From BACKLOG
  "Next — SEO + AEO follow-through".) Increasingly where discovery happens; currently blocked.
- [ ] **(REC) Keep FAQ / structured content** in articles even though Google dropped FAQ rich
  results — the Q&A shape is exactly what LLM answers extract and cite. Low cost, AEO upside.

### Indexing & search plumbing (agreed)
- [ ] **Bing Webmaster Tools setup** — import from Google Search Console, submit sitemap.
  ChatGPT search runs on Bing, so this is AEO plumbing as much as SEO.
- [~] **URL-inspect Notes URLs in Search Console + request indexing** — do after any canonical
  changes so we don't re-submit split URLs. (Canonical hostname fix is done; keep this as the
  standing action for each new batch of articles.)
- [ ] **Internal linking discipline** (already in force, restated here as it's core distribution):
  every new article links inline to 2–3 related pieces; siblings retro-patched to link back in
  the same PR; every article ends with a soft in-context CTA to the tool.

---

## 3. Measurement

You can't distribute well without seeing what's landing.

- [ ] **Confirm GA is collecting again** and add a synthetic monitor / weekly check that GA
  event count > 0 over a rolling 7-day window. GA silently dropped events for ~5 days once
  (CSP too-narrow); that failure mode shouldn't recur unseen. (From BACKLOG security follow-up.)
- [ ] **(REC) Monthly one-page marketing scan.** Standing note at month-end: top-performing
  articles, biggest movers, weakest queries, which distribution channel drove what. Feeds the
  refresh loop (§1) and the "change tack after 6 weeks of a dead cluster" rule already in the
  publishing schedule. Keep it to one page — decisions, not dashboards.
- [ ] **(REC) Track tool-visit source.** Make sure we can see which articles / channels
  actually send people into the Dedrab tool, not just which get traffic. That's the number
  that matters for a conversion-first content strategy.

---

## Parked / out of scope (noted so we don't lose them)

Out of the agreed content+distribution scope, but marketing-adjacent and worth a home:

- **Waitlist launch announcement.** `WaitlistGate` promises "we'll email you the moment it's
  live" but there's no send-side implementation yet (tracked in `BACKLOG.md`). When the beta
  goes live this becomes a real launch-distribution task: a one-off send to every
  `waitlist_signups` row. Don't let the promise go unfulfilled at launch.
- **Email nurture, paid media, partnerships, brand identity** — deliberately excluded from
  this file's scope for now. Revisit if/when we widen it.
- **B2B garden-centre licensing** as a channel — sits in BACKLOG under exploration/validation.

---

## Maintenance

- Update this file whenever a content or distribution move is added, agreed, completed, or
  reshuffled — same active-maintenance discipline as `BACKLOG.md`.
- This is the Cowork-written copy. The repo copy at `MARKETING_BACKLOG.md` is the source of
  truth; a mirror lives in the Claude Project. If they drift, the repo wins.
- Git for the repo copy runs through Claude Code, not Cowork — remember to commit it there.


---

## Status — 7 October 2026 catch-up

Done in repo: 13 articles drafted and future-dated (see `docs/publishing-schedule.md`), a 3-pin set per article in `docs/pins/`, `docs/retro-link-queue.md` for older-article backlinks, per-article publish checklist, small-garden URL rename + redirect.

Needs Steen (accounts / dashboards, cannot be done from the repo):
- [ ] **Cloudflare**: switch off the managed robots.txt / AI-crawler blocking (Content Signals Policy). The app's own `src/app/robots.ts` already allows all crawlers, so the block is at Cloudflare level.
- [ ] **Bing Webmaster Tools**: sign in, import from Google Search Console, submit `https://www.dedrab.com/sitemap.xml`.
- [ ] **Pinterest**: create cluster boards (Hardiness, Problem Solving, Costs, Low Maintenance, Before & After, Comparisons, Small Gardens) and pin from `docs/pins/` on each publish day.
- [ ] **Search Console**: request indexing for each new URL on its publish day.
- [ ] **Cover images** for all 12 live-scheduled articles (and the held one).
