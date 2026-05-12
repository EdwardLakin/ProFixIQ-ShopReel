# ShopReel Operator Runtime PR1 (Foundation)

## Scope
This PR establishes the first foundation for the persistent AI operator runtime canvas on `/shopreel` without replacing existing route-first behavior.

## Contracts added
- Added `src/features/shopreel/ui/system/operatorRuntime.ts` with strict string-literal runtime contracts:
  - `OperatorRuntimeState`
  - `OperatorSurfaceId`
  - `OperatorTransitionMode`
  - `OperatorRuntimeIntent`
  - `OperatorRuntimeContext`
  - `OperatorRuntimeResolution`
- Resolution is explicit and typed: `state`, `surfaceId`, `transitionMode`, `confidence`, `summary`, `recommendedRouteFallback`, and `contextCarryover`.

## Mapper behavior
- Added `src/features/shopreel/ui/system/resolveOperatorRuntime.ts` as a pure command-intent/context mapper.
- It maps command language and context into runtime state + surface first, while always preserving route fallback.
- Rule coverage includes campaign planning, review/approval, refinement, asset/library intake, publish/package/export, and manual operations.
- Unknown/unclear commands resolve to interpretation-safe fallback behavior.

## `/shopreel` runtime shell scaffold
- `HomeCommandClient` now tracks a local runtime resolution.
- On command submission:
  1. Existing command execution remains intact.
  2. Runtime resolution is derived and displayed.
  3. Existing navigation still executes as fallback.
- Hero gets a compact "operator active" style when runtime state is not idle.
- Added a compact "Active runtime surface (scaffold)" panel showing:
  - runtime state
  - surface title
  - summary
  - placeholder status text
  - `Open full workspace` route fallback link

## Placeholder surfaces (explicitly not full inline workflows yet)
The scaffold currently exposes placeholder copy for:
- campaign planning
- review inbox
- asset intake
- publish package review
- manual operations
- campaign workspace

This intentionally signals that inline runtime rendering is being prepared and is not yet a full runtime rebuild.

## Route fallback preservation
- Existing route behavior remains primary-safe.
- The scaffold preserves and communicates fallback routes explicitly.
- Links and navigation paths to current pages remain available.

## What remains for next PRs
1. Wire real inline surface components progressively per state.
2. Add approval-driven transition controls within the runtime shell.
3. Expand context carryover from memory/continuity into inline workflow modules.
4. Add interruption/recovery transitions and reduced-motion behavior.
