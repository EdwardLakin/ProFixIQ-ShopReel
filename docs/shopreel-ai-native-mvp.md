# ShopReel AI-Native MVP Architecture (Phase 0)

## Product goal

ShopReel MVP is an **AI-native prompt-to-video/export workflow** optimized for speed to publish-ready assets:

1. Upload photos/videos.
2. Enter a natural-language prompt.
3. Select target platforms (Instagram Reels, Facebook Reels, TikTok, YouTube Shorts) or defaults.
4. AI generates plan + storyboard + script + captions + voiceover text + thumbnail direction.
5. User reviews/edits.
6. System renders MP4 + thumbnail.
7. User manually downloads/exports package and publishes directly on social platforms.
8. User marks exported/posted and optionally saves live URL.

## Manual export-first principle

Manual export is the MVP critical path. Direct social publishing/integrations must not block create → review → render → export.

## Canonical MVP user flow

- `/shopreel` (home)
- `/shopreel/create` (prompt + source input)
- `/shopreel/review/[id]` (review/edit generated output)
- `/shopreel/render-jobs` (render progress/queue)
- `/shopreel/exports` (downloadable packages)
- `/shopreel/library` (history/content library)
- `/shopreel/settings` (workspace defaults)

## Canonical route map (Phase 0)

| Route | Role |
|---|---|
| `/shopreel` | Canonical home/dashboard entry |
| `/shopreel/create` | Canonical creation start |
| `/shopreel/review/[id]` | Canonical review permalink (currently bridges to generations detail) |
| `/shopreel/render-jobs` | Canonical render jobs list with shop-scoped statuses, failure details, and retry actions |
| `/shopreel/exports` | Canonical manual export center |
| `/shopreel/library` | Canonical library/history route (currently bridges to content) |
| `/shopreel/settings` | Canonical workspace settings |

## Canonical API direction

Phase 0 keeps existing handlers intact and introduces direction only:

- **Create**: prompt-first generation endpoints under `/api/shopreel/create/*` and `/api/shopreel/generations*`.
- **Review/Edit**: generation review/draft update endpoints.
- **Render**: `/api/shopreel/render-jobs*` + workers.
- **Exports**: manual asset/sign/create/complete flow under `/api/shopreel/manual-assets/*`.
- **Settings**: `/api/shopreel/settings`.

## Canonical now vs legacy/advanced/post-MVP

### Canonical now
- Canonical route journey above.
- Manual export-first user completion.
- MVP feature-flag gating for advanced/navigation visibility.

### Legacy/advanced/post-MVP
- OAuth-required connection flows.
- Direct publish queues as a required success path.
- Calendar-led scheduling as required step.
- Campaign/operator/autopilot pipelines.
- Experimental video-creation studio flows.

## Phase roadmap

- **Phase 0**: stabilization, canonical navigation clarity, route inventory, feature flags, docs.
- **Phase 1**: prompt-first creation flow hardening.
- **Phase 2**: review/edit workspace canonicalization.
- **Phase 3**: render job pipeline normalization.
- **Phase 4**: manual export package UX and package integrity.
- **Phase 5**: library/history quality and searchability.
- **Phase 6**: optional integrations (OAuth/direct publish/analytics sync).

## MVP non-goals

- No required OAuth.
- No required direct social publishing.
- No analytics-sync dependency for successful output.
- No platform account requirement before export/download.

- Phase 3 canonical start-render endpoint: `POST /api/shopreel/generations/[id]/render` returns `{ renderJobId, renderJobsUrl }` and deduplicates active jobs.
- Render status model normalized to: draft, queued, processing, ready, failed, cancelled, archived, unknown.
- Phase 4 remains: manual export package creation/storage and package integrity workflows in `/shopreel/exports`.

