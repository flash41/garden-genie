# Dedrab Notes — Content Standards

Applies to every new Notes article from 7 Oct 2026. Existing pre-October articles are not retrofitted unless refreshed. The per-article publish checklist in `docs/publishing-schedule.md` enforces these.

## The three rules

1. **Question title, definite answer.** The title is the question a real person types ("What will grow in a north-facing garden?"). The answer is given immediately and plainly — a verdict first ("Shade-tolerant foliage plants, ferns and woodland bulbs do best"), then the conditions. No "it depends" without a default answer attached. The meta description opens with the answer too.
2. **Go narrow on places, not broad on topics.** Where the answer genuinely changes by climate, rules or plant availability, say where: name the places (UK nations/regions, Irish provinces or coasts, US regions/zones, Australian states/climates) with concrete differences. Prefer a narrow, specific piece over a broad overview; when a broad topic is worth owning, break it into place-specific pieces (queue them in the schedule) rather than one generic guide. Titles may name a place when the piece is truly place-specific. Generic pieces keep a neutral title but must carry the regional breakdown. (UK first, Ireland second, US third, Australia welcome.)
3. **Same layout every time.**

## Standard layout (in this order)

1. Frontmatter — `title` (a question), `description` (starts with the answer, 150–160 chars), `publishedAt`, `category`, `tags`, `featured: false`, `draft`, `hasFaq: true`, cover image fields once an image exists.
2. `<Callout type="note">` **Quick answer.** — 2–3 sentences, definite verdict first.
3. Short opening scenario ("Why This Matters in Your Back Garden"), no invented statistics.
4. Body — H2 sections, ideally phrased as the sub-questions readers have. Comparison tables where the topic is "X vs Y".
5. `## By region` — regional breakdown with `###` sub-headings (UK, Ireland, US, Australia; narrower places where the evidence supports it). Include whenever anything varies by place; omit only when truly universal (state nothing).
6. `## Frequently Asked Questions` — 4–5 `###` questions with short, definite answers (this exact heading feeds FAQ schema).
7. `## Related Notes` — 3–4 links (`- [Title](/notes/slug)`), only to articles dated on or before this one.
8. `### References` — real sources, each fetched and read, as `- Publisher, [Page title](URL)`.
9. **Tool CTA — the closing block.** A soft, in-context paragraph under its own `## ` heading that leads to the Dedrab Garden Action Plan from a photo of the reader's own garden, linking `https://www.dedrab.com`. Nothing follows it.

## Always
- Warm, second person, benefit-led; soft builder presence ("we've found"); no guaranteed outcomes.
- British English; never invent figures, quotes or sources; paraphrase, don't copy.
- Roughly 1,500–2,300 words of body text including the regional breakdown (excluding references).
