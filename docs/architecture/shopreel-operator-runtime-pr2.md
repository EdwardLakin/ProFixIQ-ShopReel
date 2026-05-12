# ShopReel Operator Runtime PR2 (Orchestration Shell)

## Runtime session model
PR2 introduces a canonical client-side runtime session reducer in `operatorRuntimeSession.ts`.
It tracks runtime state, active/previous surface, pending transition, compressed hero state,
active command, operator summary, interruption/recoverable context, selected entity ids,
and route fallback. This is React-safe and dependency-free.

## Surface registry
`operatorSurfaceRegistry.ts` defines canonical inline surface metadata for all current surface ids,
including labels, descriptions, placeholder status, preferred transition mode, route fallback, and
render priority. Scaffold surfaces added:
- CampaignPlanningSurface
- ReviewInboxSurface
- CampaignWorkspaceSurface
- AssetIntakeSurface
- PublishPackageSurface
- ManualOperationsSurface
- BlockedRecoverySurface

## Hero lifecycle
`/shopreel` hero now supports:
1. Expanded idle cinematic operator state.
2. Post-command compression into persistent command console.
3. Sticky compressed mode across inline runtime orchestration.
4. Manual restore path for expanded hero.

## Interrupt / recover behavior
The runtime model now supports:
- interrupting the active workflow into manual operations,
- capture of resumable context,
- recover action to restore prior workflow state/surface.

## Transition orchestration
`OperatorRuntimeCanvas.tsx` orchestrates inline surface continuity:
- active surface region render
- previous-surface continuity indicator
- compact operator thinking/interpreting overlay while transition is pending
- blocked/interrupt messaging
- full-workspace fallback action

Transition contracts were expanded with new modes:
- `inline_replace`
- `inline_stack`
- `overlay_focus`
- `restore_previous`
- `fallback_route`

## Remaining gaps before true inline migration
1. Replace scaffold cards with real inline workflow modules progressively.
2. Bind transition engine derivation to runtime session updates for richer choreography.
3. Add deeper context carryover across campaign/review/library entities.
4. Add route-sync hooks so deep-link visits hydrate runtime session consistently.
5. Add expanded reduced-motion tuning and viewport-specific transition policy.
