# ShopReel Inline Workflow Embodiment PR3

## Inline campaign embodiment strategy
PR3 converts the runtime campaign planning scaffold into a true inline orchestration module inside the persistent runtime canvas. The module now embodies interpreted intent, objective framing, platform/channel targeting, continuity memory signals, and actionable refinement controls without replacing canonical campaign routes.

The runtime now embeds campaign planning behavior rather than sending users straight into route pivots. Route fallback remains available as compatibility and deep-link support.

## Continuity philosophy
The runtime is now designed to feel like one evolving flow:
- planning to refinement mutates in the same active workflow region
- command context and operator summary persist
- continuity notices carry forward context from workspace memory and creative preference memory
- previous surface context remains visible

Continuity signals intentionally explain *why* the runtime is making next recommendations (tone updates, pacing preferences, and current campaign thread continuation).

## Review handoff model
Review handoff now appears inline first as a compact module:
- pending review cards are surfaced in-canvas
- each card offers approve / refine / reject operator actions
- operator explanation provides why approval is currently required
- canonical `/shopreel/review` route fallback is preserved for full review workspace

## Progression model
PR3 introduces a lightweight progression ribbon inside the runtime canvas:
1. Planning
2. Drafting
3. Refining
4. Awaiting approval
5. Packaging
6. Ready

This progression is intentionally subtle and operator-aware (not an enterprise-style global tracker), with state highlighting driven by current runtime state.

## Remaining migration gaps
- Inline module actions currently drive command orchestration and route fallback; deeper entity-level binding to campaign/review APIs is still needed.
- Review card actions currently re-enter command orchestration and do not directly post review decisions inline.
- Campaign planning/refinement still depends on workspace memory signals rather than full campaign entity hydration in-canvas.
- Surface choreography can be further polished with richer transition primitives and shared motion tokens.

## Next recommended PRs
1. Bind inline campaign planning/refinement controls to canonical campaign entity fetch + mutation pathways.
2. Bind inline review actions directly to canonical review decision endpoints with optimistic UI and rollback handling.
3. Add route/session hydration so direct deep links can restore runtime state and continuity notices consistently.
4. Port publish/package and library modules with same inline-first + route-fallback orchestration strategy.
