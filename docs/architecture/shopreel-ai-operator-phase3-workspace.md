# ShopReel AI Operator Reset — Phase 3 Campaign Workspace

## What changed

Phase 3 consolidates campaign operation around the canonical route:
- `/shopreel/campaigns/[id]`

The campaign detail page now acts as the AI operating workspace with a clear structure:
1. Mission context
2. Current AI step (dominant)
3. Approval/decision panel
4. Outputs and deliverables
5. Continuity/memory support

This pass reuses existing campaign, agent, rendering, publishing, and memory infrastructure without backend rewrites.

## Flows consolidated into the workspace

Conceptually consolidated into `/shopreel/campaigns/[id]`:
- Campaign production operations
- Campaign review entry
- Campaign approval gating for agent-proposed tasks
- Item-level deep links as nested campaign context

## Compatibility routes preserved

The following routes remain valid and are intentionally preserved for deep-link compatibility:
- `/shopreel/campaigns/[id]/production` → redirects to `/shopreel/campaigns/[id]?panel=production`
- `/shopreel/campaigns/[id]/review` → redirects to `/shopreel/campaigns/[id]?panel=review`
- `/shopreel/campaigns/items/[id]` remains available as secondary item detail workspace

No routes were deleted.

## Remaining fragmentation

Still partially fragmented (intentionally deferred):
- Review inbox remains split across campaign-local approvals and broader review surfaces.
- Item-level production depth still lives in `/shopreel/campaigns/items/[id]` for advanced editing.
- Queue/ops surfaces remain outside the campaign workspace by design.

## Recommendations for next review inbox phase

For the next phase, prioritize:
1. Unified decision inbox model backed by canonical approval tasks.
2. Shared decision DTOs for campaign-local and global review queues.
3. A single approval action language (approve / reject / refine with reason capture).
4. Clear escalation from campaign workspace to cross-campaign review when volume grows.
5. Preserve explicit human approval gates before execution/publish transitions.
