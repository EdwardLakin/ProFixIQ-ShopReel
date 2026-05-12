# ShopReel Surface Inventory for AI Operator Reset (Step 1)

This inventory classifies current user-facing surfaces for reset planning only.

| Route/path | Current purpose | Keep / demote / merge / dev-only | Reason | Candidate canonical destination |
|---|---|---|---|---|
| `/shopreel` | Home/command entry for ShopReel shell | Keep | Best location for intent-first command surface | `/shopreel` (Command) |
| `/shopreel/dashboard` | Legacy dashboard alias/variant | Merge | Duplicate home mental model; keep route but demote primacy | `/shopreel` |
| `/shopreel/create` | Create/start workflow for generation/campaign starts | Merge | Useful entry capability but should feed campaign operator flow | `/shopreel` and `/shopreel/campaigns/new` |
| `/shopreel/campaigns` | Campaign index/list and management | Keep | Canonical campaign list and mission selection | `/shopreel/campaigns` |
| `/shopreel/campaigns/[id]` | Campaign overview plus production actions, AI planning, approvals | Keep | Best existing anchor for canonical AI workspace | `/shopreel/campaigns/[id]` |
| `/shopreel/campaigns/[id]/production` | Production route currently redirecting to campaign detail | Merge | Already effectively merged; keep compatibility route | `/shopreel/campaigns/[id]` |
| `/shopreel/campaigns/[id]/review` | Campaign-stage review route | Merge | Review belongs as panel/tab in canonical campaign workspace | `/shopreel/campaigns/[id]` |
| `/shopreel/campaigns/items/[id]` | Item-level production/detail workspace | Merge | Item detail should be sub-surface of campaign workspace | `/shopreel/campaigns/[id]` |
| `/shopreel/video-creation` | Advanced/experimental video creation flow | Demote | Valuable engine but fragmented for primary UX | `/shopreel/campaigns/[id]` (advanced panel) |
| `/shopreel/video-creation/advanced` | Deep advanced creation controls | Dev-only | Specialist surface not suitable for main loop | Advanced/developer links under settings/ops |
| `/shopreel/video-creation/jobs/[id]` | Job-level creation diagnostics | Dev-only | Job internals should not be primary workflow | Advanced job link from campaign workspace |
| `/shopreel/video-creation/series/[seriesKey]` | Series orchestration/debug surface | Demote | Useful for power users, not core operator loop | Campaign workspace outputs/history area |
| `/shopreel/generations` | Raw generation list/review queue | Demote | Useful data source but too machinery-forward | `/shopreel/review` |
| `/shopreel/generations/[id]` | Generation detail/editor/review | Merge | Review details should be unified with campaign review context | `/shopreel/campaigns/[id]` or `/shopreel/review/*` |
| `/shopreel/render-jobs` | Canonical render job list/status | Keep | Real lifecycle truth; keep accessible | `/shopreel/review` and `/shopreel/campaigns/[id]` |
| `/shopreel/render-queue` | Legacy/alternate render queue UI | Demote | Duplicate queue surface; retain for compatibility | `/shopreel/render-jobs` |
| `/shopreel/publish-center` | Publish preparation/control center | Keep | Real publish lifecycle surface, but secondary to operator flow | `/shopreel/campaigns/[id]` outputs/publish panel |
| `/shopreel/publish-queue` | Queue-level publish operations | Demote | Operations detail should be secondary | `/shopreel/publish-center` |
| `/shopreel/published` | Publishing history/logs | Demote | Historical output useful but not primary loop | `/shopreel/library` |
| `/shopreel/editor/*` | Fragmented editor variants | Merge | Parallel editor surfaces fragment ownership | `/shopreel/campaigns/[id]` |
| `/shopreel/review/*` | Review surfaces for approvals/edits | Keep | Needed as canonical approval inbox concept | `/shopreel/review` |
| `/shopreel/library` | Asset/output/history library | Keep | Canonical long-term memory/artifact access | `/shopreel/library` |
| `/shopreel/upload` | Manual upload/asset intake | Keep | Needed asset intake capability; can be integrated later | `/shopreel/library` and `/shopreel/campaigns/[id]` assets panel |
| `/shopreel/opportunities` | Opportunity discovery and campaign seeding | Demote | Valuable feeder system but not core loop entry | `/shopreel/campaigns` |
| `/shopreel/storyboards` | Storyboard-focused standalone flow | Demote | Storyboard should be one step inside campaign workspace | `/shopreel/campaigns/[id]` |
| `/shopreel/automation` | Automation control plane/internals | Dev-only | Internal orchestration surface, not operator-first UX | Advanced/developer operations area |
| `/shopreel/operations` | Operational diagnostics and recovery | Dev-only | Critical for ops, not primary user journey | Advanced/developer operations area |
| `/shopreel/operator` | Operator/debug console | Dev-only | Debug/system view should remain gated | Advanced/developer operations area |
| `/shopreel/settings` | Settings/auth/billing/workspace controls | Keep | Required persistent product control surface | `/shopreel/settings` |
| `/shopreel/settings/developer/growth-agent` | Developer-only growth-agent experiments | Dev-only | Explicit experimental/dev route | `/shopreel/settings` (developer section) |

## First implementation recommendation

- Make `/shopreel` the Command surface.
- Make `/shopreel/campaigns/[id]` the canonical campaign AI workspace.
- Move production/review/item details into panels or tabs inside that workspace.
- Reduce primary nav to Command, Campaigns, Review, Library, Settings.
- Keep queues and operations accessible only from developer/advanced links.

