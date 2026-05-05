# ShopReel Route Inventory (Phase 0)

Classification legend: `canonical`, `canonical-supporting`, `advanced`, `legacy-kept`, `deprecated-candidate`, `unknown-needs-review`.

## Pages

| Path | File path | Classification | Current purpose | Phase 1-6 disposition | Notes/risk |
|---|---|---|---|---|---|
| `/shopreel` | `src/app/shopreel/page.tsx` | canonical | Home/entry point. | Keep canonical. | - |
| `/shopreel/create` | `src/app/shopreel/create/page.tsx` | canonical | Start content creation. | Harden in Phase 1. | - |
| `/shopreel/review/[id]` | `src/app/shopreel/review/[id]/page.tsx` | canonical | Canonical review permalink (bridge redirect). | Replace bridge with native review UX in Phase 2. | Redirect dependency on generations detail. |
| `/shopreel/render-jobs` | `src/app/shopreel/render-jobs/page.tsx` | canonical | Canonical render jobs path (bridge redirect). | Replace bridge in Phase 3. | Redirect dependency on render-queue. |
| `/shopreel/exports` | `src/app/shopreel/exports/page.tsx` | canonical | Manual export-first center. | Expand in Phase 4. | Initial shell only. |
| `/shopreel/library` | `src/app/shopreel/library/page.tsx` | canonical | Canonical library path (bridge redirect). | Replace bridge in Phase 5. | Redirect dependency on content page. |
| `/shopreel/settings` | `src/app/shopreel/settings/page.tsx` | canonical | Workspace settings. | Keep; extend gradually. | - |
| `/shopreel/upload` | `src/app/shopreel/upload/page.tsx` | canonical-supporting | Manual upload helper flow. | Keep supporting in P1/P4. | Could merge into create UX. |
| `/shopreel/generations` | `src/app/shopreel/generations/page.tsx` | canonical-supporting | Review queue/list. | Fold into review workspace P2. | Legacy naming. |
| `/shopreel/generations/[id]` | `src/app/shopreel/generations/[id]/page.tsx` | canonical-supporting | Existing review detail route. | Alias/migrate behind `/review/[id]`. | Keep for backward links. |
| `/shopreel/render-queue` | `src/app/shopreel/render-queue/page.tsx` | legacy-kept | Existing render queue UI. | Migrate to `/render-jobs` in P3. | Keep during transition. |
| `/shopreel/content` | `src/app/shopreel/content/page.tsx` | legacy-kept | Existing content library list. | Migrate to `/library` in P5. | Keep during transition. |
| `/shopreel/content/[id]` | `src/app/shopreel/content/[id]/page.tsx` | advanced | Content detail/editor context. | Re-evaluate P5. | Shape may differ from MVP assets. |
| `/shopreel/publish-center` | `src/app/shopreel/publish-center/page.tsx` | advanced | Operations publish board. | Optional P6 integrations. | Not required for MVP completion. |
| `/shopreel/publish-queue` | `src/app/shopreel/publish-queue/page.tsx` | advanced | Queue for social publishing. | Optional P6. | Integration-coupled. |
| `/shopreel/published` | `src/app/shopreel/published/page.tsx` | advanced | Publish history. | Optional P6. | Keep for existing users. |
| `/shopreel/calendar` | `src/app/shopreel/calendar/page.tsx` | advanced | Calendar planning/scheduling. | Optional P6. | Non-blocking feature. |
| `/shopreel/video-creation` | `src/app/shopreel/video-creation/page.tsx` | advanced | Experimental studio flow. | Keep experimental. | Flagged experimental. |
| `/shopreel/campaigns*` | `src/app/shopreel/campaigns/**/page.tsx` | advanced | Campaign orchestration flows. | Post-MVP evaluation (P6+). | Complex pipeline risk. |
| `/shopreel/opportunities*` | `src/app/shopreel/opportunities/**/page.tsx` | advanced | Opportunity discovery and campaign seeding. | Optional P6+ discovery track. | Not required for MVP path. |
| `/shopreel/editor*` | `src/app/shopreel/editor/**/page.tsx` | advanced | Multi-format editor variants. | Consolidate into Phase 2 review workspace. | Potential overlap/confusion. |
| `/shopreel/operator` | `src/app/shopreel/operator/page.tsx` | legacy-kept | Operator/ops console. | Keep behind advanced nav. | Needs product owner decision. |
| `/shopreel/dashboard` | `src/app/shopreel/dashboard/page.tsx` | deprecated-candidate | Historical home variant. | Keep alias until traffic is low. | Already normalized to `/shopreel` in nav logic. |
| `/shopreel/analytics` | `src/app/shopreel/analytics/page.tsx` | advanced | Analytics UI. | Optional P6. | Analytics sync non-goal for MVP. |
| `/shopreel/automation` | `src/app/shopreel/automation/page.tsx` | advanced | Automation control plane. | Optional P6+. | Autopilot coupling risk. |
| `/shopreel/account` | `src/app/shopreel/account/page.tsx` | unknown-needs-review | Account-area route. | Evaluate whether merge into settings. | Scope unclear vs settings. |

## API routes (grouped)

| Path pattern | File path(s) | Classification | Current purpose | Phase disposition | Notes/risk |
|---|---|---|---|---|---|
| `/api/shopreel/manual-assets/*` | `src/app/api/shopreel/manual-assets/**/route.ts` | canonical-supporting | Manual asset package sign/create/complete/generate. | Core for Phase 4. | Ensure package contract stability. |
| `/api/shopreel/create/*` | `src/app/api/shopreel/create/**/route.ts` | canonical-supporting | Prompt/idea/angle creation pipeline. | Phase 1 hardening. | Route surface may collapse later. |
| `/api/shopreel/generations*` | `src/app/api/shopreel/generations/**/route.ts` | canonical-supporting | Generation list/detail/review/publish ops. | Phase 1-2 core; publish ops optional. | Naming overlaps with review route. |
| `/api/shopreel/story-generations*` | `src/app/api/shopreel/story-generations/**/route.ts` | legacy-kept | Alternate generation model & actions. | Merge or retire by P2/P3. | Duplicate capability risk. |
| `/api/shopreel/storyboards` `/story-sources*` `/reel-plan` | corresponding route files | canonical-supporting | Story planning inputs and derived plans. | Keep as support services. | Validate ownership boundaries. |
| `/api/shopreel/render-job*` `/render-jobs*` `/render-worker` | corresponding route files | canonical-supporting | Render job lifecycle + workers. | Normalize in Phase 3. | Two naming families (`render-job` vs `render-jobs`). |
| `/api/shopreel/publications*` `/publish*` `/publish-worker` `/connections` `/oauth/*` | corresponding route files | advanced | Social publishing + connectivity + queue workers. | Optional Phase 6. | Must never block manual export path. |
| `/api/shopreel/settings` | `src/app/api/shopreel/settings/route.ts` | canonical-supporting | Shop/workspace defaults. | Keep and extend. | - |
| `/api/shopreel/metrics` | `src/app/api/shopreel/metrics/route.ts` | advanced | Analytics and performance metrics. | Optional Phase 6. | Analytics non-goal for MVP completion. |
| `/api/shopreel/automation*` `/autopilot` `/scheduler` `/signals` `/worker*` | corresponding route files | advanced | Automation and background orchestration. | Optional P6+. | Complexity and failure-mode coupling risk. |
| `/api/shopreel/opportunities*` `/campaigns*` | corresponding route files | advanced | Discovery→campaign orchestration APIs. | Post-MVP track. | Large route surface. |
| `/api/shopreel/video-creation/*` `/media-jobs/*` | corresponding route files | advanced | Experimental video studio and job transforms. | Keep experimental; revisit P6+. | May diverge from canonical UX. |
| `/api/shopreel/media` `/memory` `/moments` `/discovery` `/suggestions` `/hooks` `/work-orders/*` | corresponding route files | unknown-needs-review | Supporting intelligence/media endpoints. | Review ownership during P1/P2. | Domain boundaries unclear. |

## Full discovery source

The inventory was derived from filesystem route discovery under `src/app/shopreel/**/page.tsx` and `src/app/api/shopreel/**/route.ts`; keep this document updated each phase.
