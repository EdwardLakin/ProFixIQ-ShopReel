# ShopReel Runtime Inline Review Mutations PR5

## Canonical endpoints reused
This PR reuses existing agent task approval endpoints already used by `/shopreel/review`:
- `POST /api/shopreel/agents/tasks/[id]/approve`
- `POST /api/shopreel/agents/tasks/[id]/reject`

`refine/request changes` in runtime maps to the canonical reject endpoint with refinement metadata, matching the existing review inbox decision semantics (`decisionMode: "refine"`, `refinementSignal`).

## Inline runtime decision behavior
Inline review cards in `OperatorRuntimeCanvas` now mutate canonical review/task state directly via `operatorRuntimeReviewActions.ts`:
- `approveRuntimeReviewDecision(...)`
- `rejectRuntimeReviewDecision(...)`
- `requestRuntimeReviewChanges(...)`

Each helper is typed, returns a typed success payload (`task`, `event`), and throws a typed error shape with status and retryability hints.

## Pending / success / error model
Each inline review card now tracks per-card mutation status:
- `pending`: disables review decision buttons while mutation is active.
- `success`: shows continuity confirmation copy after persistence succeeds.
- `error`: shows inline failure text and keeps route fallback to `/shopreel/review` for recovery.

This avoids fake completion and keeps decisions grounded in persisted backend mutations.

## Runtime continuity behavior after decision
On mutation success, runtime continuity updates in-canvas by:
1. setting operator summary to:
   - `Decision saved. ShopReel will carry that feedback into the next step.`
2. transitioning runtime session progression to `refining_output`.
3. persisting updated runtime session state through the existing persistence effect.

This preserves runtime continuity without introducing new backend review systems.

## Remaining gaps
1. Runtime review cards currently use recent-item status heuristics; direct hydration of full canonical task state per card can further improve inline card accuracy.
2. Inline success currently keeps cards visible with success status; a next pass can remove/downgrade resolved cards based on refreshed runtime task feeds.
3. Runtime continuity progression may eventually branch by decision type (`approve` vs `reject` vs `refine`) once deeper orchestration state is wired.
