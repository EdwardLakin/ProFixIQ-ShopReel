# ShopReel Runtime Route Classification

This table classifies existing ShopReel routes for the persistent AI operator runtime migration while preserving deep-link and manual-access compatibility.

| Route | Current purpose | Future role | Runtime surface candidate? | Manual operations candidate? | Compatibility requirement | Notes |
|---|---|---|---|---|---|---|
| `/shopreel` | Command/home shell | Persistent operator runtime canvas host | Yes (primary host) | No | High | Keeps AI operator always present; owns stateful orchestration. |
| `/shopreel/create` | Guided creation start | Inline planning/create surface + fallback route | Yes | No | High | Keep direct entry for existing flows and links. |
| `/shopreel/campaigns` | Campaign list/index | Inline campaign selection surface + fallback route | Yes | Partial | High | Useful as route fallback and bulk management view. |
| `/shopreel/campaigns/[id]` | Campaign workspace | Canonical deep-link workspace + embeddable runtime module | Yes | Partial | High | Remains canonical campaign entity route. |
| `/shopreel/review` | Review inbox | Inline approval/review decision surface + fallback route | Yes | Partial | High | Must remain canonical supervision inbox route. |
| `/shopreel/library` | Asset/library management | Inline asset intake/selection surface + fallback route | Yes | Partial | High | Activated from “Add assets” intent. |
| `/shopreel/generations` | Generation history and access | Advanced/manual inspection route | Partial | Yes | Medium | Keep for history drill-down and power users. |
| `/shopreel/render-jobs` | Render operations queue | Manual operations route | No | Yes | Medium | Queue monitoring and recovery should live under operations strategy. |
| `/shopreel/publish-center` | Publish coordination surface | Manual operations route | Partial | Yes | Medium | Advanced publish staging; not default runtime journey. |
| `/shopreel/operations` | Operations and tooling | Primary manual/power-user access hub | No | Yes (primary) | High | Entry point for queues, diagnostics, raw controls. |
| `/shopreel/automation` | Automation controls | Advanced/developer operations route | No | Yes | Medium | Keep accessible without foregrounding in operator-first UX. |
| `/shopreel/render-queue` | Legacy render queue flow | Compatibility + manual operations | No | Yes | Medium | Preserve for old links; nudge users to Operations. |
| `/shopreel/publish-queue` | Legacy publish queue flow | Compatibility + manual operations | No | Yes | Medium | Preserve and potentially link from Operations hub. |
| `/shopreel/exports` | Export package management | Compatibility + manual operations | Partial | Yes | Medium | Can be invoked from runtime assembling-package state. |
| `/shopreel/video-creation` | Advanced creation suite | Developer/advanced route | No | Yes | Medium | Avoid as primary operator journey route. |
| `/shopreel/dashboard` | Legacy dashboard surface | Compatibility route | No | Partial | Low | Should not compete with persistent runtime canvas. |
