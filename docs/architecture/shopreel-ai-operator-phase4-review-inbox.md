# ShopReel AI Operator Reset — Phase 4 Review Inbox Consolidation

## What was unified

Phase 4 establishes `/shopreel/review` as the canonical Review Inbox for AI supervision decisions.

Unified in this pass:
- Agent approval tasks requiring human decisions (approve/reject/refine) across campaigns.
- Blocked execution decisions surfaced at high priority.
- Active AI proposals surfaced in a single oversight feed.
- Historical decision activity shown with lower weight for continuity.

The inbox language is reframed around AI supervision:
- "Needs your decision"
- "AI proposal ready"
- "After approval, AI continues execution"

## Compatibility routes preserved

No routes were removed.

Compatibility paths still work:
- `/shopreel/review/[id]` remains the generation-level review workspace.
- `/shopreel/review/blog/[id]` now redirects to `/shopreel/review/[id]?source=blog`.
- `/shopreel/review/vlog/[id]` now redirects to `/shopreel/review/[id]?source=vlog`.

This reduces psychological fragmentation while preserving deep links.

## Refinement continuity integration

Refinement continuity is integrated without backend rewrites by reusing existing task transition APIs:
- Approve uses existing `/api/shopreel/agents/tasks/[id]/approve`.
- Reject and refine both use existing `/api/shopreel/agents/tasks/[id]/reject` with structured metadata.

The Review Inbox submits lightweight refinement context:
- `reason` text from the supervisor.
- metadata fields:
  - `source: review_inbox`
  - `decisionMode: reject | refine`
  - `refinementSignal`

This creates immediate continuity between approval decisions and follow-up execution.

## Remaining fragmentation

Still partial / deferred:
- Generation-level drafting refinement UX (`/shopreel/review/[id]`) remains separate from task-level inbox cards.
- Publish-specific approval events are not yet normalized into a single shared decision DTO.
- Cross-surface learning signal rollups into memory/brain planning remain light-touch metadata, not a full approval-learning policy engine.

## Phase 5 recommendation (approval-learning integration)

1. Normalize decision DTOs shared by campaign workspace and inbox.
2. Promote refinement reasons into structured memory tags (tone, pacing, compliance, hook style).
3. Feed aggregated approval tendencies into planning prompts by campaign + shop.
4. Add explainable "AI learned from your last N decisions" traces in review cards.
5. Keep explicit final human publish approval gate.
