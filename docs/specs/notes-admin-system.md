# Notes Admin System — Spec

Decision document for the semi-automated Notes content pipeline. Replaces the current "edit MDX in IDE → git push → Vercel deploys" workflow with a draft-first admin tool that preserves existing /notes URLs and MDX-in-repo rendering.

## Decisions locked

- **Public URLs unchanged.** Articles continue to live at `www.dedrab.com/notes/[slug]`. No subdomain migration. SEO authority preserved.
- **MDX-in-repo stays the source of truth for rendering.** The admin tool is a workflow layer that produces MDX commits, not a replacement renderer.
- **Admin lives at `www.dedrab.com/admin`** behind Supabase auth.
- **Drafts live in Supabase** until published. Published drafts become MDX commits to `main` via the GitHub API.
- **Existing 10 MDX articles are not migrated** into the drafts table. They stay in the repo as-is. Admin only manages new content. Reconsider migration later if there's a reason.

## Architecture at a glance

```
Steen → /admin UI → Supabase (notes_drafts) → publish action → GitHub API
                                                                    ↓
                                                              commits MDX
                                                                    ↓
                                                              Vercel deploy
                                                                    ↓
                                                       /notes/[slug] renders
```

If admin breaks, articles still render. The systems are decoupled.

## Schema (Supabase)

Table: `notes_drafts`

| column | type | notes |
|---|---|---|
| id | uuid | pk |
| slug | text | unique, kebab-case, locked once published |
| title | text | |
| description | text | meta description, used in frontmatter |
| category | text | wildlife / design / plants / planning / etc. |
| tags | jsonb | array of strings |
| cover_image_url | text | path or full URL |
| cover_image_alt | text | |
| body_mdx | text | the article body, no frontmatter |
| status | enum | draft / review / scheduled / published / archived |
| scheduled_publish_at | timestamptz | null unless status = scheduled |
| published_at | timestamptz | set on publish |
| github_commit_sha | text | set on publish, audit trail |
| created_by | uuid | fk to auth.users |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLS: only authenticated users in `admin_users` table (or matched by allowed email) can read/write.

## Routes

- `/admin` — gated. Redirects to `/admin/notes` if logged in, `/admin/login` if not.
- `/admin/login` — Supabase auth (email magic link, single allowed email initially: steen.gordon@gmail.com)
- `/admin/notes` — list view, filterable by status (draft / scheduled / published)
- `/admin/notes/new` — new draft editor
- `/admin/notes/[id]` — edit draft
- `/admin/notes/[id]/preview` — server-rendered preview using the same MDX components and CSS as live `/notes/[slug]`
- `/admin/notes/[id]/schedule` — set `scheduled_publish_at`, status → scheduled
- `/api/admin/publish-note` — POST, manually publish a single draft now
- `/api/admin/publish-scheduled` — GET, called by Vercel Cron every 15 min, publishes any scheduled drafts whose time has come

## Editor (Phase 1, MVP)

- Frontmatter as discrete form fields: title, description, category dropdown, tags (comma-separated input), cover image upload, cover alt
- Body MDX as a plain `<textarea>` with monospace font. No rich text. Markdown shortcuts work because it's MDX.
- Live preview pane on the right, refreshes on save (or every N seconds)
- Save button → upserts to `notes_drafts`, status stays `draft` unless changed

Rich text editor is Phase 3, only if needed.

## Publish mechanism

Triggered manually (button) or by cron (scheduled). Both call the same internal function.

1. Read draft from DB. Validate slug uniqueness against existing MDX files in `src/content/notes/` and against published drafts.
2. Compose MDX file content: frontmatter block from form fields + body_mdx.
3. Call GitHub API (Octokit) with a PAT scoped to dedrab repo only:
   - Create or update file at `src/content/notes/{slug}.mdx` on `main` branch
   - Commit author: `Dedrab Bot <bot@dedrab.com>` (distinguishable from human commits)
   - Commit message: `notes: publish {slug}`
4. If cover image was uploaded and lives in Supabase storage, copy it to `public/images/notes/{slug}.{ext}` via GitHub API in the same flow (or keep in Supabase and reference by full URL — see open question below).
5. Update draft: `status='published'`, `published_at=now()`, `github_commit_sha={sha}`.
6. Vercel auto-deploys on the new commit. Article goes live in ~1–2 minutes.

## Scheduling

- Vercel Cron hits `GET /api/admin/publish-scheduled` every 15 minutes.
- Endpoint queries: `SELECT * FROM notes_drafts WHERE status = 'scheduled' AND scheduled_publish_at <= NOW()`.
- For each result, run the publish flow above.
- 15-minute granularity is fine for content scheduling. Tighter granularity is over-engineering.

## Auth

- Supabase auth with email magic link
- Single allowed email initially (steen.gordon@gmail.com), enforced at RLS policy level
- `/admin` layout server-checks auth on every render, redirects to `/admin/login` if not authenticated
- No client-only auth gates — server-side enforcement only

## Open questions to resolve before build

1. **Cover image storage.** Two options: (a) upload to Supabase storage, reference by full URL in MDX `coverImage` field — cleaner, no repo churn, but introduces a runtime dependency for image rendering; or (b) commit images to `public/images/notes/` via GitHub API alongside the MDX commit — keeps existing pattern, more storage in repo, but no external dependency. **Lean: (b) for consistency with existing articles, but (a) is defensible.**
2. **Category as enum vs free text.** Existing categories: how-to, design, plants, climate, planning, wildlife. Constrain via dropdown to avoid typo-driven category fragmentation, but allow "add new" for future flexibility.
3. **Image generation in admin?** Hero images are currently produced via prompt-then-paste-into-image-tool. Worth a button that fires the prompt to an image generation API and stores the result? Phase 3 nice-to-have, not MVP.
4. **Pre-push hook on bot commits.** The local pre-push hook isn't in repo. Bot commits won't run it. CI should cover the gap — confirm `tsc --noEmit` and build run on every push to main.

## Phasing

**Phase 1 — MVP (~2–3 days in Claude Code)**
- Auth-gated `/admin` route
- `notes_drafts` table + RLS
- List view, draft editor (frontmatter form + MDX textarea)
- Live preview pane
- Manual publish button → GitHub API commit
- Test: create dummy article in admin, publish it, see it render at `/notes/test-article`, then archive it

**Phase 2 — Scheduling (~1 day)**
- `scheduled_publish_at` field, schedule UI
- Vercel Cron + `/api/admin/publish-scheduled` endpoint
- Test: schedule a dummy for 30 min in the future, watch it publish

**Phase 3 — Polish (~2 days)**
- Slug validation against repo + DB
- Image upload pipeline (decide path per open question 1)
- Rich text editor only if MDX textarea proves painful
- Audit log view (which drafts published when, by whom)

Total to replace current workflow cleanly: ~1 week of focused build. Sits behind the Gemini delay fix per BACKLOG.md.

## Risks

- **GitHub PAT in Vercel env.** Scope it to dedrab repo only. Rotate quarterly. Loss = bad actor commits to main; mitigated by branch protection if enabled.
- **Slug collision.** Two drafts with same slug = second publish overwrites first. Validate at save time and at publish time.
- **CI break on bot commit.** If `tsc` or build fails on a scheduled publish at 3am, article doesn't go live and there's no human to notice. Add Slack/email alert on failed bot commits as a Phase 2 hardening item.
- **Drift between draft preview and live render.** Preview must use identical MDX pipeline (same components, same plugins). Easiest way: use the same `<MDXRemote>` or compiled-MDX component as `/notes/[slug]` does, just with body string instead of file read.
