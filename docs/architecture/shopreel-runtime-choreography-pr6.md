# ShopReel Runtime Choreography PR6

## Choreography contracts
PR6 introduces `runtimeChoreography.ts` as a deterministic orchestration-only layer for canvas transition semantics. It derives action, continuity relation, transition intensity, continuity copy, reduced-motion-safe classes, and stale-state notices from runtime session + persistence context.

## Continuity semantics
The choreography snapshot classifies relationship between previous and active surfaces as:
- `cold_start`
- `same_surface`
- `adjacent_flow`
- `handoff`
- `interruption`
- `recovery`

These semantics avoid hard surface swaps by retaining shell continuity context and framing transitions as progression through one operational canvas.

## Transition vocabulary
The runtime choreography layer emits:
- `morph`
- `compress`
- `expand`
- `stack`
- `resolve`
- `interrupt`
- `restore`

Vocabulary is typed and deterministic, and maps to operational moments (approval waits, review resolution, manual interruption layering, workflow restoration).

## Embodiment philosophy
Canvas regions now persist across surface transitions:
- operator presence
- workflow progression
- continuity summary
- recent decision trail
- active campaign identity

This preserves emotional workflow coherence and reduces modular-card replacement feeling.

## Reduced-motion handling
No animation library was added. Choreography uses class-only motion semantics and always includes motion-reduce-safe classes (`motion-reduce:transition-none`, `motion-reduce:transform-none`).

## Stale-state handling
Choreography now emits explicit stale-state notices for:
- restored runtime from persistence
- review resolved elsewhere
- missing/unavailable active entity

Each stale notice includes explanatory copy and a route fallback action.

## Remaining gaps
- Archived-campaign detection is currently inferred from missing campaign context and should be upgraded with explicit persisted status.
- Interruption overlay visuals are semantic and lightweight; future pass can improve depth hierarchy without adding decorative motion.
- Transition semantics are currently canvas-scoped and not yet wired into all downstream surface components.
