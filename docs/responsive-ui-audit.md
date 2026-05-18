# ShopReel Responsive UI Audit (May 16, 2026)

## Surfaces Audited
- `/shopreel` (`HomeCommandClient`, `RuntimeWorldDeck`, command input/actions).
- `/shopreel/campaigns/new` (`CampaignGenerator`, parsed brief/mode/recommendations, business_advertising form flow).
- `/shopreel/campaigns/[id]` (`CampaignDetailClient`, parsed brief, readiness, next action, package/copy controls, chamber intelligence, mission memory).

## Breakpoint Assumptions
- Mobile small: 360px.
- Mobile large: 390–430px.
- Tablet portrait: 768px.
- Tablet landscape: 1024px.
- Desktop: 1280px.
- Large desktop: 1440px+.

## Changes Made
- Removed fixed-height chamber traps on `/shopreel` by replacing rigid viewport-height grids with min-height behavior so content can stack on smaller devices.
- Added mobile/tablet “Active worlds” horizontal rail in `/shopreel` and kept immersive stacked deck desktop-only at `xl`.
- Increased mobile touch targets for primary command actions and quick prompts (minimum 44px intent).
- Reduced deck minimum heights and visual weight on smaller screens in `RuntimeWorldDeck`.
- Hardened campaign/new form and status strips for wrapping (`break-words`, full-width CTA on mobile).
- Reflowed campaign detail decision/package surfaces for mobile-first stack:
  - sections stack below `xl`,
  - package action controls become full-width tappable buttons,
  - production package content displayed as wrapped readable section text (not raw overflowing block),
  - stronger `min-w-0` containment on split layouts.

## Risky Class Scan Report
Command used:
- `rg -n 'h-screen|overflow-hidden|absolute|fixed|w-\[[^]]+\]|min-w|pre|whitespace-nowrap|xl:grid-cols|lg:grid-cols' <audited files>`

Intentional uses kept:
- `absolute` retained for decorative background layers/orbs where non-interactive (`pointer-events-none`) and clipped by parent.
- `overflow-hidden` retained in deck internals where it is needed for visual card stacking.
- `xl:grid-cols`/`lg:grid-cols` retained for desktop multi-column composition and explicitly stacked below those breakpoints.
- `min-w` retained/added as `min-w-0` guards and card minimums in mobile horizontal rails.
- `whitespace-pre-wrap` retained for long package text readability.

## Known Limitations
- `/shopreel` still uses heavy visual atmosphere layers; lower-end mobile GPUs may still show reduced animation smoothness.
- Full UX validation for all campaign item subroutes depends on runtime data shape and live campaign states.

## Manual QA Checklist
- [ ] At 360px, verify no horizontal page overflow on `/shopreel`, `/shopreel/campaigns/new`, `/shopreel/campaigns/[id]`.
- [ ] Confirm command input remains first primary interaction on `/shopreel` mobile.
- [ ] Confirm runtime deck is not shown as right-side panel below `xl`.
- [ ] Confirm campaign/new CTA is clearly visible and easy to tap on mobile.
- [ ] Confirm campaign detail “Primary next action” remains near top and actionable.
- [ ] Confirm package text wraps and copy buttons are easy to tap on mobile.
- [ ] Confirm generate image/video/publish controls remain secondary to package approval.

## Dashboard Navigation + Deck Follow-up (May 18, 2026)
- Restored dashboard navigation access to **Settings** from sidebar/navigation surfaces and global utility actions.
- Restored global controls: **Home** (`/shopreel`) and **Back** (`router.back()` with `/shopreel` fallback).
- Restored desktop/tablet deck visibility requirement:
  - `xl+`: visible stacked deck on the right.
  - `md`/`lg`: visible compact stacked deck (not plain pills).
  - `sm`: simplified horizontal cards.

### Manual QA Checklist (Dashboard Navigation + Deck)
- [ ] `/shopreel` desktop (1440px+) shows a visible stacked deck.
- [ ] `/shopreel` laptop/desktop (1280px) still shows deck/stack (not pills only).
- [ ] `/shopreel` tablet shows deck/cards with visible depth.
- [ ] `/shopreel` mobile shows active-world cards and remains usable.
- [ ] Settings is reachable from dashboard navigation and utility row.
- [ ] Back works from campaign detail/post-review/job/settings pages, with safe fallback to `/shopreel`.
