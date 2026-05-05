# ShopReel AI-Native MVP Audit (2026-05-05)

## A. Executive summary

- **Overall readiness for AI-native prompt-to-video/export MVP:** **6.5 / 10**.
- Repo already contains substantial foundations for uploads, AI generation, queueing, rendering records, and publishing/history tables.
- Main risk is **product surface fragmentation**: multiple overlapping create/generate/render/publish systems and legacy naming (`content_*`, `reel_*`, `shopreel_*`).
- Launch path should treat **manual export package** as canonical and decouple from social account requirements.

### Top 5 reusable assets
1. Signed upload + manual asset persistence (`manual-assets/create|sign|complete`) and `shopreel_manual_assets`/`shopreel_manual_asset_files`.
2. Story source/generation model (`shopreel_story_sources`, `shopreel_story_generations`) and list/review pages.
3. Render queue and job APIs (`reel_render_jobs`, `/api/shopreel/render-job`, `/shopreel/render-queue`).
4. Platform modules (`instagram|facebook|tiktok|youtube` + registry) for adaptation and export copy.
5. Publish/publication schema (`content_publications`, `shopreel_publish_jobs`) for post-MVP optional integrations.

### Top 5 missing launch-critical capabilities
1. A single canonical `/create -> /review -> /render -> /export` route journey.
2. Explicit `export_packages` + `manual_post_records` lifecycle model (currently fragmented across publications/manual assets).
3. Canonical platform preset type with safe zones, checklist, naming, CTA/caption defaults.
4. Hardened render completion path that always yields MP4 + thumbnail + downloadable package record.
5. User-facing export history with manual posted URL capture wired into first-class UI.

### Top 5 risks/blockers
1. Route and API sprawl creates accidental parallel systems and maintenance risk.
2. Widespread `as any` usage in server pages/routes weakens strict TS guarantees.
3. Mixed storage bucket naming (`shopreel-media` vs `shopreel-manual-assets`) can break retrieval conventions.
4. Admin client usage in app surfaces increases cross-tenant leak risk if filters are missed.
5. Social publishing UX surfaces are prominent and may distract from manual export-first launch.

---

## B. Current-state maps

## 1) Route map (current)

### Core ShopReel pages (detected)
- `/shopreel` (home)
- `/shopreel/create`
- `/shopreel/upload`
- `/shopreel/generations`, `/shopreel/generations/[id]`
- `/shopreel/render-queue`
- `/shopreel/content`, `/shopreel/content/[id]`
- `/shopreel/publish-center`, `/shopreel/publish-queue`, `/shopreel/published`, `/shopreel/calendar`
- `/shopreel/settings`
- `/shopreel/video-creation`
- plus advanced/legacy routes (campaigns/opportunities/editor/operator/etc.)

### API families (high-level)
- `manual-assets/*` upload flow.
- `create/*`, `generations/*`, `story-generations/*` generation/review actions.
- `render-job*`, `render-jobs*`, `render-worker` render actions.
- `publish*`, `publications*`, queue/worker endpoints.
- `settings`, `metrics`, `automation`, `opportunities`, `campaigns`, `video-creation/jobs`.

## 2) Feature map
- `src/features/shopreel/manual/*` upload/manual asset UI + storage helpers.
- `src/features/shopreel/story-sources/*` source normalization and generation persistence.
- `src/features/shopreel/video-creation/*` provider adapters, storyboard/prompt helpers, job orchestration.
- `src/features/shopreel/publishing/*` publication bundle + enqueue/process logic.
- `src/features/shopreel/operations/*` operator diagnostics/retry/readiness.
- UI shell + navigation in `src/features/shopreel/ui/*`.

## 3) Data model map (current)
Primary tables visible in schema dump/migrations:
- Core/legacy content model: `content_assets`, `content_pieces`, `content_publications`, etc.
- ShopReel layer: `shopreel_story_sources`, `shopreel_story_generations`, `shopreel_storyboards`, `shopreel_storyboard_scenes`.
- Upload/manual assets: `shopreel_manual_assets`, `shopreel_manual_asset_files`.
- Render/pipeline: `reel_render_jobs`, `shopreel_media_generation_jobs`, `shopreel_premium_assembly_jobs`.
- Publishing/ops: `shopreel_publish_jobs`, `content_publications`, `shopreel_campaign*`.
- Settings/billing/signals: `shop_reel_settings`, `shop_marketing_memory`, `shop_content_signals`, subscription/usage tables.

## 4) Media pipeline map (current)
`Upload page -> create manual asset -> sign upload URL -> client uploads to storage -> complete API records files + marks uploaded -> generation endpoints consume source metadata`.

## 5) AI pipeline map (current)
- Prompt enters via `/shopreel/create` (topic-first creator mode).
- API `/api/shopreel/create/research-script` calls creator AI services and persists source + generation structures.
- `video-creation/providers/*` adapters exist for OpenAI/Runway/Pika and job records.
- Storyboard/content outputs partially generated; different routes support different outputs.

## 6) Export/publishing map (current)
- Render queue tracks `reel_render_jobs`.
- Publication and publish-queue systems exist.
- Manual export artifacts are not yet presented as a single package-first UX with explicit posted URL lifecycle.

---

## C. Reuse matrix

| Area | File paths | Current purpose | Reuse class | Required changes |
|---|---|---|---|---|
| Upload creation | `src/app/api/shopreel/manual-assets/create/route.ts` | Creates tenant-scoped upload container metadata | Reuse as-is | Add optional project/generation linkage fields |
| Upload signing | `src/app/api/shopreel/manual-assets/sign/route.ts` | Returns signed upload token/path | Reuse with small refactor | Enforce MIME/size whitelist; unify bucket naming |
| Upload completion | `src/app/api/shopreel/manual-assets/complete/route.ts` | Records uploaded files and marks asset uploaded | Reuse with small refactor | Validate ownership + bucket consistency; thumbnail metadata |
| Create prompt surface | `src/app/shopreel/create/page.tsx` | Creator-mode prompt workflow | Reuse only after hardening | Shift to upload-first prompt-to-video MVP IA |
| Generation listing/review entry | `src/app/shopreel/generations/page.tsx` | Lists generated items and review/edit links | Reuse with small refactor | Map to canonical `/review` and `/library` modes |
| Render queue UI | `src/app/shopreel/render-queue/page.tsx` | Shows processing jobs and attempts | Reuse with small refactor | Add failure details/progress/retry + export handoff CTA |
| Platform adapters | `src/features/shopreel/platforms/*.ts` | Platform-specific logic | Reuse with small refactor | Introduce single `PlatformPreset` contract |
| Video provider adapters | `src/features/shopreel/video-creation/providers/*.ts` | AI media job dispatch to providers | Reuse only after hardening | Standardize status transitions and output schema |
| Publish pipeline | `src/features/shopreel/publishing/lib/*.ts`, `src/app/api/shopreel/publications/*` | Publish bundle + queue processing | Reuse later | Feature-flag for post-MVP launch |
| Settings persistence | `src/features/shopreel/settings/*`, `shop_reel_settings` | Brand/workspace defaults | Reuse with small refactor | Expand schema for voice/style/default CTA/hashtags |

---

## D. Gap matrix

| Desired capability | Current status | Files involved | Missing pieces | Priority |
|---|---|---|---|---|
| Canonical `/create` upload+prompt+platform selection | Partial | `shopreel/create`, `shopreel/upload`, `manual-assets/*` | Unified flow, defaults, one request model | P0 |
| `/review` editable storyboard/script/captions | Partial | `generations/[id]`, `editor/*`, story-source modules | Consolidated review workspace + save semantics | P0 |
| `/render` robust pipeline with retry/progress | Partial | `render-queue`, `render-job*`, provider adapters | Canonical status model + visible failure UX | P0 |
| `/export` package-first manual download | Missing/fragmented | publications/content pages/manual assets | MP4+thumbnail+caption+hashtags package and checklist | P0 |
| `/library/history` with posted URL tracking | Partial | content/generations/published pages | Manual post records table+UI and filters | P1 |
| Brand defaults for platform/style/voice | Partial | settings page + settings table | Additional fields and injection into AI prompts | P1 |

---

## E. AI-native architecture audit

- **AI maturity score:** **6 / 10**.

### What is real
- Prompt-based generation exists and persists results.
- Provider adapters for AI media generation exist.
- Story-source/generation structures are operational.

### What is mocked/hardcoded/fragile
- Some provider paths return placeholder payloads/modes.
- Multiple overlapping generation routes imply inconsistent contracts.
- Several pages use loose typing (`any`) around critical generation/render payloads.

### What should become canonical
- Single `GenerationRequest` (prompt + assets + platform targets + brand profile).
- Single `GenerationOutput` (concept, storyboard, script, captions, on-screen text, VO, platform outputs).
- Unified status + retry model across generation and render jobs.

---

## F. Manual export/download audit

- **Export readiness score:** **4.5 / 10**.

### Current ability snapshot
- MP4 tracking: partial via render jobs/publications.
- Thumbnail: partial via job endpoints; not consistently tied to export package UX.
- Captions/hashtags: generated in places but not normalized into export asset bundle.
- Export history: fragmented across content/publication surfaces.
- Manual posted URL capture: appears partial/non-canonical.

### Missing pieces (launch-critical)
1. Canonical `export_packages` record linked to generation/render outputs.
2. Download endpoints for MP4/thumbnail plus text artifact bundle.
3. Manual export checklist and one-click copy blocks.
4. `manual_post_records` with URL + timestamp + platform + actor.

### Safest launch path
- Keep all social integrations optional/hidden by feature flag.
- Ship explicit manual-export pages and APIs first.

### Security/storage concerns
- Ensure signed URLs are always tenant-scoped and short-lived.
- Remove reliance on public URLs for sensitive buckets.
- Enforce MIME/type/size validation server-side before completion updates.

---

## G. Platform preset audit

### Existing support
- Platform modules exist for Instagram/Facebook/TikTok/YouTube.
- No single canonical preset contract found that includes safe zone/checklist/export naming.

### Proposed canonical type

```ts
export type PlatformPreset = {
  id: "instagram_reels" | "facebook_reels" | "tiktok" | "youtube_shorts";
  label: string;
  aspectRatio: "9:16";
  recommendedDurationSec: { min: number; max: number; target: number };
  safeTextZone: { topPct: number; bottomPct: number; sidePct: number };
  captionStyle: "short_hook" | "educational" | "story";
  hashtagStyle: "broad_plus_niche" | "niche_heavy";
  requiresThumbnail: boolean;
  ctaStyle: "book_now" | "learn_more" | "comment_prompt";
  exportFileNamePattern: string;
  uploadChecklist: string[];
};
```

### Proposed location
- `src/features/shopreel/platforms/presets.ts` + `platformRegistry.ts` as canonical loader.

---

## H. Media upload & asset pipeline audit

### Current upload pipeline diagram
1. User opens `/shopreel/upload`.
2. `manual-assets/create` creates `shopreel_manual_assets` row.
3. `manual-assets/sign` creates signed upload URL/path.
4. Client uploads bytes to storage.
5. `manual-assets/complete` writes `shopreel_manual_asset_files`, updates status.
6. Later generation paths consume linked source/asset data.

### Risks
- Bucket naming mismatch across sign/complete defaults.
- File validation is not strict enough for production abuse patterns.
- No obvious centralized cleanup policy for deleted assets.

### Proposed canonical asset model
- Reuse `shopreel_manual_assets` as top-level `media_asset_collections` concept.
- Reuse `shopreel_manual_asset_files` as atomic media assets.
- Add columns: `thumbnail_path`, `width`, `height`, `duration_ms`, `sha256`, `ai_usable`, `deleted_at`.

---

## I. Render pipeline audit

- **Render readiness score:** **5.5 / 10**.

### Current signals
- `ffmpeg-static` dependency exists.
- Render queue/page and render job APIs exist.
- AI provider adapters can start media generation jobs.

### Reusable
- Current `reel_render_jobs` and render queue UX baseline.
- Existing job endpoints/worker routes as orchestration backbone.

### Must add for MVP
- Deterministic output contract: MP4 path, thumbnail path, caption payload, completion timestamps.
- Retry with capped attempts + clear user-visible failure reason.
- Progress updates and stale-job detection.

### Best MVP rendering approach
- Keep current queue model and add canonical `render_jobs` service wrapper.
- Use ffmpeg-based assembly for uploaded images/video clips with generated script/captions.
- Keep provider-generated clips optional enhancement, not required for baseline render success.

---

## J. Data model audit + migration plan

### Existing table/type map highlights
- Existing equivalents already cover most needed domains:
  - `shopreel_manual_asset_files` ≈ `media_assets`
  - `shopreel_story_generations` ≈ `content_generations`
  - `reel_render_jobs`/`shopreel_media_generation_jobs` ≈ render jobs
  - `content_publications` + `shopreel_publish_jobs` for publication lifecycle

### Missing/fragmented
- No explicit canonical `export_packages` table.
- No explicit canonical `manual_post_records` table.
- Platform-variant outputs likely embedded JSON instead of normalized rows.

### Suggested incremental migrations
1. Add `shopreel_export_packages` (generation_id, render_job_id, mp4_path, thumbnail_path, caption_text, hashtags, checklist_json, status).
2. Add `shopreel_manual_post_records` (export_package_id, platform, posted_url, posted_at, created_by).
3. Add `shopreel_generation_platform_outputs` (generation_id, platform, caption, hashtags, cta, notes).
4. Add indexes on `(shop_id, created_at desc)` and RLS ownership policies.

### RLS/security notes
- Preserve shop-scoped ownership checks on all new tables.
- Prohibit cross-shop selects/updates; allow service role only for worker updates.

### Supabase types notes
- Regenerate `src/types/supabase.ts` after each migration.

---

## K. Navigation and UX audit

### Current sidebar map
- Home, Create, Pipeline, Publish, Workspace, Advanced/Experimental groups.
- Includes contextual/experimental/deprecated-ish mixed entries.

### Issues
- Too many overlapping pathways for core MVP.
- Publish/integration surfaces are highly prominent before export-first value is completed.

### Suggested IA
- `/shopreel` Dashboard
- `/shopreel/create`
- `/shopreel/review/[id]` (or canonicalized generations detail)
- `/shopreel/render-jobs`
- `/shopreel/library`
- `/shopreel/exports`
- `/shopreel/settings`
- Hide/feature-flag calendar/publish integrations/experimental labs for MVP.

---

## L. Integrations audit

### Classification
- **Required for MVP:** none.
- **Optional later:** OAuth connect/callback, publish queue, calendar, publication enqueue/worker.
- **Risky for MVP focus:** UI routes that imply account connection is mandatory.

### Decoupling points
- Ensure generation/render/export buttons never gate on connected account state.
- Keep publishing APIs callable only from flagged UI surfaces.

---

## M. Security and tenancy audit

### Critical risks
1. Admin client usage with insufficient `shop_id` filtering can leak records.
2. Storage URLs/public URLs may expose assets if bucket policy is permissive.

### High risks
1. Inconsistent bucket naming and path conventions.
2. Missing strict upload validation (type/size/content).

### Medium risks
1. `any`-typed server data handling can bypass structural safeguards.
2. Status transitions not centralized increase invalid state writes.

### Launch blockers
- Cross-tenant data access checks for every generation/render/export API.
- Export asset download must use signed URLs and ownership checks.

---

## N. Observability and failure handling audit

- **Observability score:** **5 / 10**.

### Missing canonical failure states
- Generation timeout/cancelled/retry-exhausted.
- Render stale/abandoned.
- Export package incomplete/invalid.

### Recommended status model
- `draft -> queued -> processing -> ready -> failed -> archived`
- with `failure_code`, `failure_message`, `attempt_count`, `last_attempt_at`, `next_retry_at`.

---

## O. Recommended canonical MVP architecture

## Route model
- `/shopreel/create`
- `/shopreel/review/[generationId]`
- `/shopreel/render/[generationId]` + `/shopreel/render-jobs`
- `/shopreel/export/[generationId]` + `/shopreel/exports`
- `/shopreel/library`
- `/shopreel/settings`

## API model
- `POST /api/shopreel/create` (assets + prompt + platforms)
- `GET/PATCH /api/shopreel/generations/:id`
- `POST /api/shopreel/generations/:id/render`
- `GET /api/shopreel/render-jobs/:id`
- `POST /api/shopreel/generations/:id/export-package`
- `GET /api/shopreel/export-packages/:id`
- `POST /api/shopreel/export-packages/:id/manual-post`

## Flow model
- Upload assets -> generate creative plan -> review/edit -> render -> export package -> manual post record.

---

## P. Phased implementation plan

## Phase 0 — stabilize and inventory
- **Goal:** freeze canonical paths and flag duplicates.
- **Likely files:** sidebar/nav, route docs, architecture docs, API index docs.
- **DB changes:** none required.
- **Checks:** type/lint/build smoke.
- **Acceptance:** single documented canonical flow and flagged legacy routes.

## Phase 1 — prompt-first creation
- **Goal:** upload-first + natural prompt + default platforms.
- **Likely files:** `shopreel/create`, manual upload components, create API contract.
- **DB:** add/normalize generation request fields.
- **Checks:** create API tests, form validation, typecheck.
- **Acceptance:** user can create generation draft from uploaded media + prompt.

## Phase 2 — review/edit workspace
- **Goal:** editable storyboard/script/captions/platform variants.
- **Likely files:** generations detail/editor surfaces.
- **DB:** optional platform outputs table.
- **Checks:** persistence tests + optimistic update states.
- **Acceptance:** edits save and persist before render.

## Phase 3 — render job pipeline
- **Goal:** deterministic MP4+thumbnail with progress/retry.
- **Likely files:** render APIs/workers/queue UI/provider wrapper.
- **DB:** enrich render job state fields.
- **Checks:** worker integration tests; retry behavior.
- **Acceptance:** clear success/failure and retry from UI.

## Phase 4 — manual export package
- **Goal:** first-class download/copy package and manual-post tracking.
- **Likely files:** new export routes/pages/APIs.
- **DB:** `shopreel_export_packages`, `shopreel_manual_post_records`.
- **Checks:** signed URL ownership checks, e2e export flow.
- **Acceptance:** user can download/copy assets and save posted URL.

## Phase 5 — library/history
- **Goal:** searchable project/export/post history.
- **Likely files:** content/library/exports pages.
- **DB:** indexing and optional denormalized list views.
- **Checks:** query performance + pagination tests.
- **Acceptance:** drafts/exports/posted states visible in one IA.

## Phase 6 — optional integrations later
- **Goal:** re-enable connected publish/scheduling/analytics sync.
- **Likely files:** publish queue/calendar/oauth/integrations pages/APIs.
- **DB:** only additive if needed.
- **Checks:** feature-flag tests and failure-isolation tests.
- **Acceptance:** integrations do not block manual export path.

---

## Q. First implementation prompt (for next Codex run)

```text
Implement Phase 0 only for ShopReel with minimal-risk, incremental changes.

Scope:
1) Create/refresh a canonical architecture doc that defines one MVP flow: /shopreel/create -> /shopreel/review/[id] -> /shopreel/render-jobs -> /shopreel/exports.
2) Update sidebar/navigation labels and ordering to reflect canonical MVP flow while preserving existing routes behind an "Advanced" section.
3) Add a route inventory markdown mapping every existing ShopReel page/API route into: canonical, legacy-kept, deprecated-candidate.
4) Do not remove any existing route handlers yet.
5) Keep strict TypeScript; do not introduce any `any`.
6) Add feature-flag constants for hiding social publishing integrations in MVP mode (no behavior change outside nav visibility).

Deliverables:
- Updated docs and nav components.
- No schema migrations in Phase 0.
- Include exact commands run and results for lint/type/build.
```

---

## R. Commands to run for validation (as currently available)
- `pnpm install` (or `npm install` depending CI lockfile policy)
- `pnpm lint` (repo currently defines lint script)
- `pnpm build`
- `pnpm exec tsc --noEmit`

(Repo currently has no explicit `test` script in `package.json`.)
