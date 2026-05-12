# ShopReel AI Operator Reset (Step 1 Foundation)

## 1) Product thesis

**ShopReel is an AI creative operator, not a dashboard of tools.**

This reset reframes ShopReel from a route-heavy system-of-screens into a guided operator loop where the user supplies intent, approves decisions, and the AI executes bounded next steps using existing lifecycle infrastructure.

## 2) Scope and current maturity statement (safe audit)

Repository inspected: `ProFixIQ-ShopReel` (canonical ShopReel product repo).

Current state is **partially implemented but valuable**:
- The repo has real persisted campaign, item, scene, render, publishing, and agent approval/execution primitives.
- The repo also has fragmented UX ownership across multiple overlapping surfaces (campaign routes, creation routes, render/publish queues, editor variants, ops/debug routes).
- Several advanced/internal capabilities are already exposed in primary navigation, creating cognitive overload for the intended intent→approval→execution model.

## 3) What to keep (canonical engine foundation)

Keep as first-class product capabilities in the reset:
- Campaigns.
- Campaign items.
- Manual assets / library.
- Render jobs.
- Export packages.
- Publish flows.
- Agent planning.
- Agent task approvals.
- Executions.
- Brain / memory / learning.
- Billing / auth / settings.

These systems already form the execution substrate needed for the AI operator model and should be consolidated under a clearer primary UX, not rebuilt from scratch in this phase.

## 4) What to demote from primary UX (retain, but advanced/developer access)

Demote from the primary user journey:
- Render queues.
- Publish queues.
- Operations surfaces.
- Automation internals.
- Advanced video creation tools.
- Raw generations browsing.
- Storyboards as standalone top-level workflow.
- Operator/debug surfaces.
- Fragmented editor variants.

Demotion means: keep routes and logic operational, but remove them from primary mental model and top-level navigation in early implementation phases.

## 5) Canonical user loop

Target loop for ShopReel AI Operator:

1. **Intent**
2. **AI interpretation**
3. **AI plan**
4. **User approval**
5. **AI execution**
6. **Review**
7. **AI next action**
8. **Export / publish package**

This loop should become the dominant route, UI copy, and interaction architecture.

## 6) Proposed primary navigation

Primary nav should reduce to exactly:
- **Command**
- **Campaigns**
- **Review**
- **Library**
- **Settings**

Everything else moves to contextual deep links, advanced menus, or developer surfaces.

## 7) Proposed canonical campaign workspace

Canonical workspace target: `/shopreel/campaigns/[id]`

Single workspace structure:
1. **Campaign mission/brief area** (intent, audience, objective, constraints).
2. **Current AI step** (what the AI is doing now / proposes now).
3. **Approval/decision panel** (approve, reject, refine, reason capture).
4. **Next action panel** (what happens immediately after approval).
5. **Outputs/assets area** (generated scripts/scenes/videos/exports/publish-ready artifacts).

Production/review/item details should progressively move into this single workspace as tabs/panels rather than separate primary routes.

## 8) Approval learning model

Every user decision should enrich taste memory and approval policy over time.

Approval/rejection/refinement events should update structured preference memory such as:
- Tone preference.
- Visual style preference.
- Hook style preference.
- Pacing preference.
- Platform preference.
- Disliked phrasing.
- “Too AI” signals.
- Brand constraints / prohibited claims / must-include language.

The learning loop remains human-governed: no autonomous publish without explicit final approval.

## 9) Safety rule for phase-one implementation

**Do not delete or break existing routes in the first implementation phase. Hide/demote before removing.**

This allows incremental migration with low risk, preserves backward compatibility, and avoids disrupting existing operational workflows.

## 10) Migration strategy

### Phase 1 — Documentation/Audit only (this step)
- Produce reset thesis and route/surface inventory.
- Define keep/demote/merge policy.
- Establish canonical destinations.

### Phase 2 — Navigation simplification
- Shift top-level nav to Command/Campaigns/Review/Library/Settings.
- Keep advanced routes accessible via secondary/developer links.

### Phase 3 — Canonical campaign workspace
- Consolidate campaign production/review/item behaviors into `/shopreel/campaigns/[id]` panels/tabs.

### Phase 4 — Review inbox
- Normalize pending approvals/rejections/refinements into one review queue/inbox.

### Phase 5 — Approval learning loop
- Wire approval/rejection/refinement data into taste memory updates and planning context reuse.

### Phase 6 — Semi-autonomous execution controls
- Add explicit autonomy boundaries, confidence thresholds, and final human approval gates.

## 11) First implementation recommendation (short)

1. Make `/shopreel` the **Command** surface.
2. Make `/shopreel/campaigns/[id]` the canonical campaign AI workspace.
3. Move production/review/item details into panels or tabs inside that workspace.
4. Reduce primary nav to Command, Campaigns, Review, Library, Settings.
5. Keep queues and operations accessible only from developer/advanced links.

