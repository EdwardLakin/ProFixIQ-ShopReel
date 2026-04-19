# ShopReel Canonicalization Pass (2026-04-19)

This pass applies the 2026-04-19 full feature audit as source-of-truth and narrows route/API ownership without broad rewrites.

## Canonical route ownership

- Home: `/shopreel`
- Create: `/shopreel/create`
- Opportunities: `/shopreel/opportunities`
- Generations/review: `/shopreel/generations`
- Generation detail: `/shopreel/generations/[id]`
- Render queue: `/shopreel/render-queue`
- Publish center: `/shopreel/publish-center`
- Publish queue: `/shopreel/publish-queue`
- Settings: `/shopreel/settings`
- Campaigns: `/shopreel/campaigns` (experimental)
- Upload: `/shopreel/upload`
- Video editor: `/shopreel/editor/video/[id]` (editor hub remains contextual at `/shopreel/editor`)
- Library/content records: `/shopreel/content`
- Creator requests / AI requests: `/shopreel/creator-requests` (experimental)

Compatibility redirects retained:
- `/shopreel/dashboard` -> `/shopreel`
- `/shopreel/editor/[id]` -> `/shopreel/editor/video/[id]`
- `/shopreel/review/*/[id]` -> `/shopreel/generations/[id]`

## Canonical API ownership

- Generations API family: `/api/shopreel/generations/*`
  - New canonical list endpoint added at `/api/shopreel/generations`.
  - `/api/shopreel/story-generations/*` now explicitly emits deprecation headers.

- Render API family: `/api/shopreel/render-jobs/*`
  - Canonical list remains `/api/shopreel/render-jobs`.
  - Canonical detail alias added at `/api/shopreel/render-jobs/[id]`.
  - `/api/shopreel/render-job/*` now explicitly emits deprecation headers.

- Publish API family: `/api/shopreel/publications/*` + `/api/shopreel/publish-queue`
  - Canonical endpoints emit canonical ownership headers.
  - `/api/shopreel/publish` now explicitly emits deprecation headers.

## Feature classification (this pass)

- Canonical: home, create, opportunities, generations, generation detail, render queue, publish center, publish queue, settings, upload, editor/video, content library.
- Experimental: campaigns, video creation studio, creator requests.
- Deprecated/legacy: `dashboard` route alias, `story-generations` API family, `render-job` API family, direct `publish` API surface.
- Contextual-only: editor hub, publishing history, analytics.

## Navigation/discoverability alignment

Sidebar now reflects product reality:
- Added discoverability for content library, campaigns, video creation studio, and AI requests.
- Kept contextual surfaces visible but marked as contextual.
- Added explicit status labels in sidebar entries (`experimental`, `contextual`) to separate canonical vs non-canonical surfaces.

## Known remaining drift

- Campaign and video-creation systems still partially overlap canonical generation/publish lifecycle tables.
- Account/workspace route (`/shopreel/account`) still exists as contextual detail surface outside canonical settings route.
- Legacy worker endpoints remain in-tree for compatibility and have not been rewritten in this pass.
