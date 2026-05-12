# ShopReel Persistent AI Operator Runtime Canvas Plan

## Executive Summary

ShopReel should evolve from a route-driven SaaS layout into a persistent **AI Operator Runtime Canvas** centered on `/shopreel` as the canonical operator layer. The current repository already has meaningful command interpretation, continuity memory, route-intent classification, and transition metadata primitives, but these are primarily used to choose route navigation rather than to sustain one persistent runtime surface. This plan preserves existing routes and backend logic while defining how to render campaign/review/library/publish workflows inline, with the AI operator always present and user approvals explicitly governing state progression.

## Product Thesis

### From page-based SaaS
Traditional SaaS behavior here is currently mostly:
1. pick a page
2. do a task
3. navigate to another page
4. lose embodied operator continuity

### To persistent operator runtime
Target behavior:
1. user submits intent on `/shopreel`
2. AI interprets intent and classifies runtime state
3. hero compresses to persistent operator console
4. active workflow surface materializes inline (same route)
5. user approves/refines
6. runtime transitions to next state/surface without hard route jump where possible

### Architectural distinction
- **Not a normal routing model:** route becomes fallback/deep-link layer, not primary interaction loop.
- **Not a dashboard:** avoids static cards as destination model; surfaces are active workflow embodiments.
- **Not a traditional nav shell:** command/memory/approval context persists through state transitions.

## Current Canonical Map (Observed)

### Active repository and top-level scope
- Active repo: `ProFixIQ-ShopReel`.
- Canonical runtime shell routes currently include `/shopreel`, campaigns, review, library, generation/render/publish/operations surfaces, plus advanced/developer routes.

### Canonical feature folders relevant to this plan
- `src/features/shopreel/ui/system/*` contains transition, intent, continuity, and workspace behavior modules.
- `src/features/shopreel/campaigns/*`, `review/*`, `agents/*`, `brain/*`, `memory/*` contain lifecycle-facing feature logic.

### Maturity classification
- **Implemented and trusted (partial set):** command input shell, route resolution, workspace memory persistence, campaign/review surfaces, operations/manual routes.
- **Partial:** transition engine semantics are route-centric and descriptor-rich but not yet a full inline runtime orchestrator.
- **Aspirational/unwired:** cinematic surface replacement in-place, runtime interruption/recovery orchestration within one canvas.

## Runtime State Model

Proposed canonical runtime states:

1. `idle`
   - No active command execution.
   - Hero expanded, recommendations visible.
2. `interpreting_intent`
   - Prompt parsed/classified; confidence and disambiguation evaluated.
3. `planning_campaign`
   - Campaign brief/plan surface active.
4. `awaiting_approval`
   - Explicit human decision needed before next operator action.
5. `refining_output`
   - User refinement in progress; previous draft context retained.
6. `generating_draft`
   - AI-producing output lifecycle active.
7. `assembling_package`
   - Packaging/export/publish preparation active.
8. `reviewing_decision`
   - Review inbox or targeted decision surface active.
9. `blocked_missing_input`
   - Runtime cannot proceed without required user/context input.
10. `manual_operations_mode`
   - User intentionally enters raw/manual tools domain.
11. `completed_export_ready`
   - Deliverable finalized and ready for export/publish handoff.

State progression must be explicit, reversible where possible, and explained to users.

## Hero Transformation Plan

## Initial hero state (`idle`)
- Full-height operator hero with multiline intent input.
- Context starter prompts and recommendations.
- Visible “Manual tools / Open Operations” secondary entry.

## Compressed operator console state (post-first command)
- Hero compresses into sticky operator bar/console.
- Console keeps:
  - command input
  - interpreted intent summary
  - last decision + next required approval
  - continuity memory snippets

## Persistent layout regions (single-page runtime)
1. **Persistent Command Bar** (top/sticky)
2. **Active Workflow Region** (main inline surface)
3. **Contextual Side Panel** (task state, blockers, dependencies)
4. **Memory/Approval Rail** (recent decisions, taste signals, approval gates)

## State-to-Surface Mapping (Intent → Inline Surface)

- “Launch a campaign…” → `campaign_planning_surface`
- “Review approvals” → `review_inbox_surface`
- “Refine this campaign” → `campaign_refinement_surface`
- “Add assets” → `asset_intake_surface`
- “Publish this” → `publish_package_review_surface`
- “Open manual tools” → `manual_operations_surface_entry`

Rules:
- Prefer in-place surface replacement in `/shopreel` runtime shell.
- Keep route navigation as explicit fallback or deep-link action.
- Preserve continuity context across surface swaps.

## Existing Route Classification (No Deletions)

| Route | Future role classification | Notes |
|---|---|---|
| `/shopreel/create` | runtime surface candidate + compatibility route | Create flow can render as inline planning/briefing surface; route retained for direct access. |
| `/shopreel/campaigns` | runtime surface candidate + compatibility route | Campaign list can be inline “select active workflow” panel. |
| `/shopreel/campaigns/[id]` | runtime surface candidate | Canonical campaign workspace stays primary deep-link and can be embedded/ported as runtime surface module. |
| `/shopreel/review` | runtime surface candidate | Canonical decision inbox surface for inline runtime review state. |
| `/shopreel/library` | runtime surface candidate | Asset/library intake should be inline when intent requests assets. |
| `/shopreel/generations` | manual operations route + compatibility route | Keep for inspection/history and advanced drill-down. |
| `/shopreel/render-jobs` | manual operations route | Power-user visibility/queues; not primary runtime journey. |
| `/shopreel/publish-center` | manual operations route | Advanced publish controls and queue diagnostics. |
| `/shopreel/operations` | manual operations route (primary manual hub) | Consolidate manual access center. |
| `/shopreel/automation` | developer/advanced route + manual operations candidate | Keep accessible, not first-run user default. |

## Transition Engine Audit and Requirements

## Existing files audited
- `transitionEngine.ts`
- `workflowTransitionModel.ts`
- `campaignCommandHandoff.ts`
- `executeShopReelCommand.ts`
- `commandInputIntent.ts`
- `commandIntentClassifier.ts`
- `aiWorkspaceMemory.ts`
- `operationalGraph.ts`
- `workflowEmbodiment.ts`
- `spatialWorkspaceBehavior.ts`

## Current strengths
- Deterministic command intent classification exists.
- Transition metadata and canonical descriptors already exist.
- Workspace memory and continuity structures exist.
- Handoff mechanism exists for command-to-create campaign bootstrapping.

## Gaps vs persistent runtime canvas
1. Transitions are still oriented around selecting next route.
2. `PATHS` in transition engine references legacy route lineage and lacks inline surface transition targets.
3. Runtime state machine is implicit across helpers, not explicit and centralized.
4. No canonical interrupt/recover protocol tied to persistent shell rendering states.
5. Reduced-motion and mobile-safe transition behavior are not first-class transition contracts.

## Required evolution (without backend rewrites)
1. Introduce `OperatorRuntimeState` and `OperatorSurfaceId` contracts in UI-system layer.
2. Upgrade transition engine to resolve **state + surface** first, route second.
3. Add hero compression state transitions as part of transition model.
4. Add `contextCarryover` contracts for command, memory, pending approvals, and selected entity ids.
5. Add reduced-motion branch in transition primitives.
6. Add viewport-aware transition policy (mobile/tablet/desktop).
7. Add interrupt/recover transition intents (e.g. blocked → manual ops, manual ops → restore state).

## Manual Operations Strategy

`/shopreel/operations` becomes the manual/power-user access layer for:
- direct page access
- queues (render/publish/etc.)
- generations drill-down
- diagnostics and raw tools
- manual recovery flows

`/shopreel` runtime should expose only a compact entry such as:
- “Open Operations”
- “Manual tools”

Manual controls are never removed; they are intentionally demoted from primary narrative.

## Phased Implementation Plan

### Phase 1 — Architecture + state model (planning only)
- Finalize runtime architecture doc.
- Define `OperatorRuntimeState`, `OperatorSurfaceId`, and transition contracts.
- Define route-to-surface compatibility policy.

### Phase 2 — Operator runtime shell prototype on `/shopreel`
- Introduce runtime shell scaffold with persistent regions.
- No route deletions and no backend changes.

### Phase 3 — Hero compression + persistent command console
- Implement initial expanded hero and post-command compressed console.
- Preserve command continuity and memory rendering.

### Phase 4 — Inline campaign planning surface
- Render campaign planning surface in active workflow region.
- Use existing campaign APIs/components where feasible.

### Phase 5 — Inline review/approval surface
- Render review inbox state inline with approval/refine paths.

### Phase 6 — Inline library/asset intake surface
- Render asset intake/library workflow inline with intent-driven activation.

### Phase 7 — Operations page as manual access hub
- Consolidate manual/advanced entry points and operational tooling links.

### Phase 8 — Transition polish, reduced-motion, mobile refinement
- Motion/accessibility hardening.
- Tablet/mobile-safe state transitions and surface choreography.

### Phase 9 — Deprecate primary reliance on page navigation (preserve routes)
- Make runtime-canvas interactions default.
- Keep deep links and existing routes fully compatible.

## Risks and Guardrails

- Do not break existing routes.
- Do not duplicate business logic in new runtime-only variants.
- Do not create parallel campaign/review systems.
- Do not hide manual controls completely.
- Do not make animation decorative/gimmicky over workflow truth.
- Maintain accessibility and reduced-motion behavior.
- Preserve deep-link compatibility.
- Preserve Supabase/auth/security patterns and existing access boundaries.

## Recommended First Implementation PR

**Scope (small, high-confidence):**
1. Add typed runtime contracts (state, surface, transition result) under `src/features/shopreel/ui/system`.
2. Add pure mapper from command intent + context to runtime state/surface.
3. Add non-invasive runtime shell wrapper in `/shopreel` home that can render current hero as `idle` surface and compressed console placeholder for post-command state.
4. Keep route push behavior as fallback until inline surfaces are incrementally wired.

**Explicit non-goals for first PR:**
- no route rewrites
- no API changes
- no backend lifecycle changes
- no deletion of existing pages

This establishes architecture without destabilizing current production paths.
