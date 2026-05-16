# ShopReel Responsive UI Audit (May 16, 2026)

## Surfaces audited
- `/shopreel` home chamber (`HomeCommandClient`, `RuntimeWorldDeck`, `OperatorRuntimeCanvas` integration).
- `/shopreel/campaigns/new` (`CampaignGenerator` and parsed brief/intake form).
- `/shopreel/campaigns/[id]` (`CampaignDetailClient` including next-action, package display, chamber intelligence, memory node).

## Breakpoint assumptions
- Mobile small: 360px.
- Mobile large: 390–430px.
- Tablet portrait: 768px.
- Tablet landscape: 1024px.
- Desktop: 1280px+.
- Large desktop: 1440px+.

## Changes made
1. **Operator home (`/shopreel`)**
   - Removed fixed viewport traps from major layout wrappers (`h-[100svh]` changed to `min-h-[100svh]`).
   - Added mobile-first world deck section (`xl:hidden`) so runtime worlds become a stacked/tap-first block instead of a right rail.
   - Kept right-side recessed deck desktop-only (`xl:block`).
   - Promoted touch target size for command and action controls with `min-h-11`/`min-w-11` patterns.
   - Added `aria-label` to the icon-only search button.

2. **Runtime world deck**
   - Reduced card/deck heights on small screens while preserving desktop depth.
   - Reduced mobile transforms and glow effects to avoid crowding and clipping.
   - Limited heavy decorative glow to `lg+`.

3. **Campaign generator (`/campaigns/new`)**
   - Ensured form fields are full width on small screens.
   - Added sticky mobile create-action container so primary CTA remains visible in long forms.
   - Updated recent-campaign action links to stack/wrap better on small screens.

4. **Campaign detail (`/campaigns/[id]`)**
   - Hardened mobile spacing and touch targets (`min-h-11`).
   - Converted package output from raw JSON `<pre>` block into readable per-section cards.
   - Added `break-words` + `whitespace-pre-wrap` to long package content sections.
   - Wrapped action groups into full-width buttons on mobile; preserves secondary ordering for generate/publish actions under package approval.

## Static risk checks and findings
Commands run:
- `rg -n 'h-screen|100svh' ...`
- `rg -n 'w-\[[^]]+\]|min-w-\[[^]]+\]' ...`
- `rg -n 'overflow-hidden|\babsolute\b|<pre|whitespace-pre-wrap' ...`

Findings summary:
- `100svh` remains where intentional (`min-h` wrappers + desktop deck viewport), no `h-screen` found in audited files.
- Decorative `absolute` layers still exist in operator home and deck (visual-only), but runtime content areas now avoid fixed-height clipping on mobile.
- Raw `<pre>` package block was removed from campaign detail and replaced with section cards.

## Known limitations
- This pass did not include Playwright/device screenshot automation, so visual validation is manual.
- Decorative orbital effects still render on mobile; layout safety was prioritized without redesigning the visual system.
- Additional shell-level components outside touched surfaces may still require further responsive normalization.

## Manual QA checklist
- [ ] At 360px, verify no horizontal page scroll on `/shopreel`, `/shopreel/campaigns/new`, `/shopreel/campaigns/[id]`.
- [ ] On mobile, verify primary CTA is visible and clearly above secondary generate/publish actions.
- [ ] On tablet portrait/landscape, verify runtime deck does not crowd command input.
- [ ] Verify package sections wrap and remain copyable on mobile.
- [ ] Verify icon-only controls have accessible labels.
- [ ] Verify focus-visible outlines remain visible on keyboard navigation.
