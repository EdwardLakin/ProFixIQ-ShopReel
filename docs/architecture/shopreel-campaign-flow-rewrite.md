# ShopReel Campaign Flow Rewrite

## Goal
Make campaigns the clean guided premium workflow without deleting existing manual tools.

## New flow

1. /shopreel/campaigns
   - campaign list
   - new campaign button

2. /shopreel/campaigns/new
   - campaign brief entry
   - title
   - core idea
   - audience
   - offer
   - goal
   - optional style/tone/platform
   - continue to review

3. /shopreel/campaigns/[id]/review
   - generated campaign summary
   - generated item angles
   - editable prompts
   - scene preview
   - approve and generate

4. /shopreel/campaigns/[id]/production
   - campaign progress
   - item list
   - scene generation status
   - sync results
   - build final ad
   - publish

5. /shopreel/campaigns/items/[itemId]
   - optional secondary detail/debug page only

## UX rules

- campaign pages use slim header, not full app nav
- one primary action per stage
- back button always shown
- no repeated button clusters
- production page is the main execution surface

## Engine rules

- campaigns use premium runway scene pipeline
- create scene jobs repairs scenes and creates fresh jobs
- rerun never silently reuses stale scene jobs
- final output pipeline:
  scene -> runway -> sync -> stitch -> openai full voiceover -> upload -> publish handoff

## Keep existing systems

Keep:
- upload
- manual creation
- video creation
- opportunities
- publish center
- analytics
- settings

Campaigns become a clean top-level guided path over the existing engine.
