# Dedrab Notes — Content Standards

Applies to every new Notes article from 7 Oct 2026. Existing pre-October articles are not retrofitted unless refreshed. The per-article publish checklist in `docs/publishing-schedule.md` enforces these.

## The three rules

1. **Question title, definite answer.** The title is the question a real person types ("What will grow in a north-facing garden?"). The answer is given immediately and plainly — a verdict first ("Shade-tolerant foliage plants, ferns and woodland bulbs do best"), then the conditions. No "it depends" without a default answer attached. The meta description opens with the answer too.
2. **Go narrow on places, not broad on topics.** Where the answer genuinely changes by climate, rules or plant availability, say where: name the places (UK nations/regions, Irish provinces or coasts, US regions/zones, Australian states/climates) with concrete differences. Prefer a narrow, specific piece over a broad overview; when a broad topic is worth owning, break it into place-specific pieces (queue them in the schedule) rather than one generic guide. Titles may name a place when the piece is truly place-specific. Generic pieces keep a neutral title but must carry the regional breakdown. (UK first, Ireland second, US third, Australia welcome.)
3. **Same layout every time.**

## Standard layout (in this order)

1. Frontmatter — `title` (a question), `description` (starts with the answer, 150–160 chars), `publishedAt`, `category`, `tags`, `featured: false`, `draft`, `hasFaq: true`, cover image fields once an image exists.
2. `<Callout type="note">` **Quick answer.** — 2–3 sentences, definite verdict first.
3. Opening: one or two sentences straight under the quick answer, no heading. No scene-setting section; if the reader needs context, it goes in the first body section.
4. Body: 3 to 6 H2 sections, each phrased as a sub-question the reader has, each opening with a one-sentence answer. Comparison tables where the topic is "X vs Y". See "Short form, high value" and "Headings" below.
5. `## By region` — regional breakdown with `###` sub-headings (UK, Ireland, US, Australia; narrower places where the evidence supports it). Include whenever anything varies by place; omit only when truly universal (state nothing).
6. `## Frequently Asked Questions`: 3 to 5 `###` questions, answers of one or two sentences, and only questions the body has not already answered (this exact heading feeds FAQ schema).
7. `## Related Notes` — 3–4 links (`- [Title](/notes/slug)`), only to articles dated on or before this one.
8. `### References` — real sources, each fetched and read, as `- Publisher, [Page title](URL)`.
9. **Tool CTA — the closing block.** A soft, in-context paragraph under its own `## ` heading that leads to the Dedrab Garden Action Plan from a photo of the reader's own garden, linking `https://www.dedrab.com`. Nothing follows it.

## Always
- Warm, second person, benefit-led; soft builder presence ("we've found"); no guaranteed outcomes.
- British English; never invent figures, quotes or sources; paraphrase, don't copy.
- No word-count target. Length is set by the question, not a quota: when every section passes the cut test below, the article is the right length.

## Short form, high value (from 14 Oct 2026)

The value is in the answer, not the word count. Every article should be useful to someone who reads only the quick answer and the headings, and better for someone who reads it all.

1. **Answer first, everywhere.** The quick answer gives the verdict. Each H2 section opens with a single sentence that answers its heading; detail follows. This is also what search engines and AI answer boxes lift.
2. **One idea per section.** If a section covers two things, split it. If it runs past roughly 300 words, break it with `###` sub-headings or cut it.
3. **Short paragraphs.** Three sentences maximum. One-sentence paragraphs are fine.
4. **Show, don't narrate.** Use a table for comparisons, `<StepList>` for sequences, `<PlantCard>` for plant picks, bullets for lists of four or more. Prose is for reasoning, not inventories.
5. **Say it once.** The quick answer, body and FAQ must not repeat each other. The FAQ picks up the questions left over.
6. **Regional breakdown stays tight.** A table, or `###` per place with two or three lines each: what differs and what to do about it.
7. **The cut test.** Before publishing, read each paragraph and ask: would the reader miss this if it were gone? If not, delete it. Usual casualties: scene-setting intros, restating the question, "it's worth noting", hedges, a closing summary that repeats the body.

## Headings (from 14 Oct 2026)

Headings are the navigation. The site builds the "Contents" list from them automatically.

- **Headline test:** reading only the title and the H2s should give someone the gist of the answer.
- H2s are the reader's sub-questions or plain statements of the point ("Which plants handle full shade?", "Fix the drainage before you plant"). Never "Introduction", "Overview", "Conclusion", "Final thoughts".
- Eight words or fewer. No colons doing the work of two headings.
- Every heading in an article must be unique (duplicate text produces duplicate anchor links).
- `##` for sections, `###` only for sub-points inside a section. Never skip from `##` to `####`.
- Avoid symbols that slugify badly (`&`, `/`, `%`, emoji) in headings; write the word.

Template: `docs/templates/notes-article-template.mdx`.
