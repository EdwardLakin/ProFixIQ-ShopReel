# Campaign Flow (Current Spine)

## Overview
Current canonical spine:

1. Prompt intake
2. Parsed brief generation
3. Campaign persistence (including parsed brief metadata)
4. Mode-specific angle generation
5. Angle approval
6. Production package build + approval
7. Copy/export package
8. Optional downstream render/publish (not automated in this phase)

## Where parsedBrief is created
- `src/features/shopreel/campaigns/lib/parseCampaignIntake.ts`
- Primary callsites:
  - Campaign generator handoff/fallback in `CampaignGenerator.tsx`
  - Intake smoke in `scripts/campaign-intake-smoke.ts`

## Where parsedBrief is persisted
- API receives parsed brief in `src/app/api/shopreel/campaigns/route.ts`
- Persisted into `shopreel_campaigns.metadata` by `createCampaign` in `src/features/shopreel/campaigns/lib/server.ts`:
  - `parsed_brief`
  - `campaign_mode`
  - `source_prompt`
  - `desired_outputs`
  - `missing_questions`

## Where mode-specific angles are generated
- `generateDifferentiatedAngles` in `src/features/shopreel/campaigns/lib/campaignIntelligence.ts`
- Angle metadata stored on campaign items in `createCampaign` (`campaign_intelligence` object), including:
  - `suggested_outputs`
  - `primary_cta`
  - `why_it_fits_brief`

## How package approval works
- Package endpoint: `src/app/api/shopreel/campaigns/items/[id]/package/route.ts`
- `POST { action: "build" }` stores `production_package` and marks status `draft`.
- `POST { action: "approve" }` keeps package and marks:
  - `production_package_status = approved`
  - `approved_at` timestamp
- Campaign detail UI reads package metadata and surfaces next actions.

## Guardrails for this phase
- Do **not** auto-render before explicit package approval.
- Do **not** add disconnected parallel campaign flows.
- Do **not** add new campaign modes in this hardening pass.

## Business Advertising / Startup Campaign Mode

For practical small-business prompts (e.g., mobile mechanic, detailing, bakery, landscaping), `business_advertising` now deterministically extracts or infers:
- business type / service category
- location or service area when present
- target customer and primary business problem
- service promise, trust signals, offer hints
- booking action, platform focus, urgency, and local tone

Production package output is copy/paste oriented and includes:
- Facebook post
- comment reply templates
- short reel script (5-scene structure)
- local ad copy (headline + primary text + CTA)
- CTA options
- follow-up post ideas for the next week

Intentionally not automated yet in this mode:
- automatic video rendering/publishing
- autonomous campaign spend optimization
- external AI enrichment calls during intake parsing

## Campaign Detail UX Rules
- Missing info must be answerable inline.
- Approval must reveal the next step.
- No dead buttons.
- Copy actions must explain where the text goes.
- Media generation is downstream and should not appear active unless wired.


## Post Review stage
- Package + image now flows to a dedicated Post Review stage for static/social ad outputs.
- `/shopreel/campaigns/items/[id]/post-review` is the canonical review destination for `business_advertising` or `static_ad` image-purpose flows.
- Video production at `/shopreel/campaigns/items/[id]` remains separate and optional.
- “Open output” semantics are now “Review finished post,” not storyboard production.

## Post Review publishing readiness
- ShopReel Settings can contain active Facebook/Instagram connections via `/api/shopreel/connections`.
- Post Review now checks the same connection source and shows publishing destination readiness for Facebook/Instagram.
- Post Review only enables a publish CTA when queue wiring is available for the specific item.
- If queue wiring is unavailable for an item, UI clearly states direct publishing is not wired yet and keeps manual copy/export actions primary.
- Manual posting fallback remains always available: copy post + caption, open/download image, and copy comment replies.

## Final Post Review Actions
- If publish queue is available for the item, primary action is **Send to publish queue**.
- If publish queue is unavailable, primary action is **Copy post + image** with explicit manual posting steps.
- Connected publishing must never be faked; blocked queue state must explain missing payload wiring.
- Post Review top workflow controls are page-scoped and should not route to generic review inbox controls.

## Settings usage in campaign lifecycle
- **Campaign intake:** Brand voice, positioning, audience notes, and compliance note shape intake summarization and brief framing before campaign generation.
- **Campaign intelligence:** Default hook template and preferred CTAs influence how ShopReel proposes angles, narrative entry points, and action intent.
- **Production package:** Voice rules, prohibited claims, and CTA preferences guide the copy package used in review-ready outputs.
- **Image/video prompt direction:** Visual style notes, default aspect ratio, and caption style influence image/video prompt quality and packaging format.
- **Publishing behavior:** Posting timezone, include brand CTA, and automation toggles define what happens after approvals (queue, draft approvals, and eventual publish behavior when fully wired).
