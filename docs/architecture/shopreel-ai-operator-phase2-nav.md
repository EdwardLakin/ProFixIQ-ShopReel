# ShopReel AI Operator Reset — Phase 2 Navigation Consolidation

## What changed

Phase 2 implements a navigation and command-surface consolidation pass without changing route compatibility, engine logic, persistence, or worker flows.

- Primary navigation is now centered on five canonical surfaces:
  - Command (`/shopreel`)
  - Campaigns (`/shopreel/campaigns`)
  - Review (`/shopreel/review`)
  - Library (`/shopreel/library`)
  - Settings (`/shopreel/settings`)
- `/shopreel` now presents intent-first command copy and explicit next-step cards instead of a dashboard-first framing.
- Existing advanced/operational routes remain active but are demoted from primary navigation.

## Routes intentionally kept but demoted

The following surfaces are intentionally retained for compatibility and specialist workflows, but removed from primary nav emphasis:

- `/shopreel/render-jobs`
- `/shopreel/render-queue`
- `/shopreel/publish-center`
- `/shopreel/publish-queue`
- `/shopreel/automation`
- `/shopreel/operations`
- `/shopreel/operator`
- `/shopreel/video-creation`
- `/shopreel/video-creation/advanced`
- `/shopreel/storyboards`
- `/shopreel/opportunities`
- `/shopreel/generations`

## How to reach advanced/developer surfaces

- Advanced routes are available from a quieter **Advanced** section in the ShopReel sidebar shell.
- Deep links and direct URL entry for all existing routes continue to work.
- Legacy alias behavior such as `/shopreel/dashboard` redirecting to `/shopreel` is preserved.

## Remaining follow-up for Phase 3 (campaign workspace)

Phase 3 should consolidate campaign-stage actions into `/shopreel/campaigns/[id]` as the canonical operator workspace, including:

- Mission and brief context
- Current AI step and plan
- Approval/refinement controls
- Execution and review continuity
- Output/package progression

This phase intentionally did not remove or rewrite existing advanced route implementations.
