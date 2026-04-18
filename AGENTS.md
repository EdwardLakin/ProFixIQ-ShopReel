# AGENTS.md

## Purpose

This repository is the canonical **ShopReel** codebase.

ShopReel is its own product/system.
It may integrate with ProFixIQ or other systems, but this repo must be treated as the **primary source of truth for ShopReel behavior, lifecycle, and architecture**.

Agents working in this repo must not reinterpret ShopReel as merely:
- a ProFixIQ dashboard marketing wrapper
- an integration settings surface
- a retry/delivery shell
- or a monitoring-only subsystem

Always treat this repo as the real ShopReel product unless the code proves otherwise.

---

## Core Rules

### 1) Respect repository scope
Work only within this repository unless explicitly instructed to analyze an external integration contract.

Do not drift into ProFixIQ-oriented assumptions.
Do not optimize for ProFixIQ wrapper pages over actual ShopReel product surfaces.
If external systems are referenced, treat them as dependencies/integrations, not the primary architecture.

### 2) Confirm scope before acting
Before making meaningful changes, identify:
- the active repository
- the canonical top-level route structure
- the canonical ShopReel feature folders
- whether the repo contains full lifecycle implementation or partial/in-progress systems

If the repo appears incomplete, say so clearly.
Do not pretend partial systems are production complete.

### 3) No fake completeness
Do not confuse:
- tables/types existing
with
- a lifecycle being truly implemented

Do not claim render, publish, campaigns, analytics, or automation are complete unless the repo has real canonical entities, flows, and UI/API support for them.

### 4) No parallel systems
Do not introduce a second architecture beside an existing one.
Prefer:
- canonicalization
- consolidation
- status/DTO normalization
- removal or isolation of dead/stale paths where safe

Do not leave duplicate abstractions unless there is a documented migration reason.

### 5) No decorative-only work
Do not spend passes on cosmetic refreshes unless they improve:
- operational clarity
- lifecycle truth
- actionability
- discoverability
- trust

UI work should make ShopReel feel sharper and more production-ready, but the repo should not accumulate visual churn disconnected from system truth.

### 6) Truth over mock behavior
No fake metrics.
No placeholder lifecycle states presented as real.
No dashboards that imply functionality the system does not actually support.
No “green” success states unless underlying persistence or downstream state proves them.

### 7) Preserve extensibility
Favor implementations that make future lifecycle stages easier to add cleanly:
- typed status enums/constants
- canonical DTOs
- clear route ownership
- clear server/client boundaries
- durable persistence-backed workflows

### 8) Be explicit about maturity
When auditing or implementing, classify systems as:
- implemented and trusted
- partial
- aspirational/unwired
- stale/dead/parallel

Use those distinctions consistently in summaries.

---

## Canonical Working Priorities

When auditing or extending ShopReel, prioritize this order:

1. **Canonical lifecycle truth**
   - source ingestion
   - opportunity persistence/lifecycle
   - build/editor entities
   - draft/review
   - render lifecycle
   - publish/schedule lifecycle
   - campaign/autopilot lifecycle
   - analytics tied to real lifecycle artifacts

2. **Canonical route ownership**
   - one primary route/surface per capability where possible
   - remove ambiguity around which page/API owns a feature

3. **Canonical data contracts**
   - shared status enums/constants
   - DTO normalization across DB/API/UI
   - nullability hardening
   - safe server/client type boundaries

4. **Operational control surfaces**
   - dashboard/home/control center should reflect real system truth
   - needs-attention states should be explainable and actionable
   - empty states should guide setup or next actions

5. **Performance and maintainability**
   - bounded queries
   - reduced duplication
   - clearer module ownership
   - less drift between features

---

## Expected Audit Behavior

When asked to audit the repo, agents must answer these questions with evidence from code:

1. What are the canonical user-facing routes?
2. What are the canonical API/server surfaces?
3. What lifecycle entities are real and persisted?
4. Which lifecycle stages are implemented vs partial vs absent?
5. Which files are dead, stale, duplicated, or parallel?
6. Which UI states overclaim real system capability?
7. Which dashboard/analytics surfaces are backed by real truth?
8. Which auth/role/tenant boundaries are enforced?
9. What is safe to improve now without rewriting the repo?
10. What should be the next build wave?

Agents must not collapse “schema exists” into “feature exists.”

---

## Implementation Standards

### Architecture
- Prefer incremental, additive improvements.
- Do not rewrite broad systems unless explicitly requested.
- Use existing feature organization and naming conventions.
- Keep route ownership and lifecycle ownership clear.

### TypeScript
- Maintain strict TypeScript.
- Reduce `any` usage in touched areas.
- Normalize enums and DTOs before layering new behavior on inconsistent contracts.
- Avoid implicit null assumptions.

### Data and persistence
- Treat persistence-backed entities as the source of truth.
- Status transitions should be explicit and explainable.
- If a lifecycle stage lacks durable persistence, do not fake certainty in UI.

### API/server behavior
- Keep server logic canonical and reusable.
- Avoid duplicating business logic across routes/components.
- Prefer typed helpers for repeated lifecycle/state logic.

### UI behavior
- Empty states should guide the next meaningful action.
- Loading/error states should be explicit.
- Dashboards should surface real health, bottlenecks, and attention states.
- Do not decorate over missing truth.

---

## Safety Against Mis-Scoping

If this repository references ProFixIQ, agents must not automatically assume:
- ProFixIQ routes are canonical
- ProFixIQ settings pages are the primary product surface
- integration delivery logs are the full ShopReel lifecycle
- ShopReel is only an integration layer

If a task mentions ProFixIQ and ShopReel together, treat ShopReel as the primary product in this repo unless instructed otherwise.

---

## Preferred Change Style

When making changes, prefer:
- exact file ownership
- narrow, high-confidence edits
- canonical constant extraction
- lifecycle/status hardening
- query/data-truth improvements
- removal of misleading UI states
- keeping summaries honest

Avoid:
- broad speculative scaffolding
- dead-end abstractions
- duplicate “v2” systems
- placeholder metrics
- docs that claim implementation that does not exist

---

## Required Final Response Structure for Major Tasks

For audits or multi-file implementation passes, final responses should include:

1. Executive Summary
2. Canonical Map
3. Lifecycle Audit by Stage
4. Findings by Category
5. Prioritized Fix Plan
6. Implemented Changes
7. Exact Files Changed
8. Testing Performed
9. Remaining Gaps / Next Phase

Be explicit about what is real today versus what is still missing.

---

## Testing Expectations

After changes, run the strongest relevant checks available.

At minimum:
- `npx tsc --noEmit`

Also run:
- targeted lint/tests for touched files
- relevant feature tests if the repo includes them

If unrelated pre-existing failures exist, separate them clearly from new issues introduced by the current pass.

---

## Default Mental Model

Agents should think:

“Build and harden the real ShopReel product system.
Do not mistake wrappers, integrations, schemas, or observability for a complete lifecycle.
Improve truth, clarity, and canonical ownership first.”