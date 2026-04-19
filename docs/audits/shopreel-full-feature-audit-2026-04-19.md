# ShopReel Full Feature Audit (2026-04-19)

This document captures a repository-wide feature audit and canonical product map for the standalone ShopReel codebase.

## Product snapshot
- ShopReel is currently an **operations-heavy content pipeline** centered on: story source ingestion, opportunity scoring, generation, review/approval, rendering, and publishing operations.
- The most canonical end-user workflow is anchored by `/shopreel` (home ops board), `/shopreel/opportunities`, `/shopreel/create`, `/shopreel/generations`, and `/shopreel/publish-center`.
- There are several adjacent/parallel systems (campaigns, video-creation studio, creator requests, old publish/render APIs) that are partially integrated and increase conceptual drift.

## Canonical surfaces observed
- Home / lifecycle board: `/shopreel`
- Create: `/shopreel/create`
- Opportunity queue: `/shopreel/opportunities`
- Generation review list: `/shopreel/generations`
- Generation detail + publish readiness: `/shopreel/generations/[id]`
- Publish operations board: `/shopreel/publish-center`
- Publish queue diagnostics: `/shopreel/publish-queue`
- Render queue: `/shopreel/render-queue`
- Settings + connection management shell: `/shopreel/settings`

## Key drift and duplication
- `ShopReelNav` is now a null component while `ShopReelSidebar` owns real nav, indicating migration residue.
- Multiple API families overlap:
  - `story-generations/*` and `generations/*`
  - `render-job` and `render-jobs`
  - `publish` vs publication/publish-job APIs
- Deprecated endpoint exists (`/api/shopreel/worker`) but remains in-tree.
- Several pages are available but not discoverable from the sidebar (campaigns, upload, editor hub, operator, content library, storyboards, creator requests).

## Maturity call
- Strongest: review/publish readiness modeling, operations boarding, and explicit review approval state.
- Mid: opportunity ingestion/generation and creator mode flow.
- Partial/experimental: campaign multi-scene automation, standalone video creation studio, learning loops.
- Weakest: unified information architecture, canonical ownership boundaries, and cross-vertical abstraction strategy.

## Immediate product architecture priorities
1. Lock canonical route/API ownership and deprecate parallel endpoints.
2. Unify generation state machine and publication truth across all creation paths.
3. Make navigation reflect all intended product capabilities (or intentionally hide and mark experimental).
4. Reduce hard-coded shop defaults/fallbacks and tighten tenant/auth context consistency.
5. Separate automotive-specific source models from generic content-engine primitives.
