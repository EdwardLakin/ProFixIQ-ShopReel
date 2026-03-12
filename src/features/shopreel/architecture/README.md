# ShopReel Architecture

ShopReel is a story engine for businesses.

Core pipeline:

Story Source -> Story Builder -> Publish

## Current implementation direction

We are NOT rebuilding ShopReel from scratch.

We are preserving the existing systems for:

- discovery
- reel planning
- rendering
- publishing
- learning
- metrics
- UI

We are adding a first-class Story Source layer so the system becomes event-driven and story-driven.

## Phase order

### Phase 1
Create domain contracts and source models.

### Phase 2
Normalize standalone inputs into Story Sources:
- manual uploads
- project-based inputs
- timestamp/day stories

### Phase 3
Generate Story Drafts from Story Sources.

### Phase 4
Map Story Drafts into existing render and publication flows.

### Phase 5
Build Story Editor UI on top of Story Drafts.

### Phase 6
Add future operational integrations such as ProFixIQ.

## Product principle

Never begin with a blank editor.

Always begin with:
- What happened today?
- Upload today's photos.
- Pick a project.
- Create a story from this work.

## Important note

At this stage ShopReel is standalone.
Operational integration is intentionally deferred.
