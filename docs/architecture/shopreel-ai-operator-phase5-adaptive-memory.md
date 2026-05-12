# ShopReel AI Operator Reset — Phase 5 Approval Learning + Adaptive Creative Memory

## What was introduced

Phase 5 adds a lightweight adaptive creative memory interpretation layer that reuses existing approval event persistence (`shopreel_agent_task_approval_events`) and existing review/campaign decision flows.

New adaptive signals now inferred from approval/rejection/refinement language:
- Less-corporate / less-scripted preference
- Stronger hook preference
- Calmer pacing preference
- Higher energy preference
- Conversational authenticity preference
- Platform-specific TikTok tendencies

## Visible learning in UX

Adaptive learning is now surfaced in two canonical supervision surfaces:
- `/shopreel/review` Review Inbox
- `/shopreel/campaigns/[id]` Campaign workspace

Both surfaces now display subtle “AI learned from you” continuity notices and lightweight taste-summary chips generated from recent decisions.

## Approval + refinement continuity flow

1. Human approves/rejects/refines in review inbox or campaign workspace.
2. Existing APIs persist decision events (no API replacement).
3. Decision metadata now includes structured continuity hints:
   - `decisionMode`
   - `refinementSignal`
   - `refinementTags` (campaign workspace rejects/refinements)
4. Adaptive memory interpreter aggregates recent events heuristically.
5. Downstream UX acknowledges what changed and why proposals are being adapted.

## Infrastructure reused

- Existing agent approval APIs:
  - `/api/shopreel/agents/tasks/[id]/approve`
  - `/api/shopreel/agents/tasks/[id]/reject`
- Existing persisted approval events table:
  - `shopreel_agent_task_approval_events`
- Existing campaign workspace and review inbox routes/components
- Existing continuity framing from prior phases

No new dependencies, no migration, and no new orchestration system were introduced.

## Heuristic vs persisted

Persisted truth:
- Approval/rejection/refinement reason text and metadata in approval events.

Heuristic interpretation:
- Pattern extraction from decision text and refinement language.
- Top signal ranking and generated continuity notices.

This keeps adaptation visible immediately while preserving human-governed approval gates.

## Future recommendations

1. Promote heuristic tags into first-class typed enums for stricter lifecycle analytics.
2. Add campaign-scoped preference snapshots to reduce repeated parsing.
3. Weight decisions by recency and downstream performance outcomes.
4. Introduce creator-level memory windows (short-term vs long-term taste).
5. Add stronger cross-platform emotional resonance modeling (hook tension, relief pacing, authenticity drift detection) while keeping human final approval.
