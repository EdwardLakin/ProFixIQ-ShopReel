# ShopReel Runtime Continuity PR4

## Hydration model
PR4 introduces campaign-entity hydration into the runtime canvas via canonical campaign reads and existing approval/run signals. The runtime now loads campaign title, lifecycle status, channels/platform mix, refinement history, review status, timestamps, and continuity metadata from `/api/shopreel/campaigns/[id]/runtime-context`.

## Deep-link restoration model
A route continuity tracker now runs across ShopReel routes and maps deep links (campaign detail, review, library, operations) into persisted runtime state. These routes become restoration checkpoints so returning to `/shopreel` restores active surface and stage rather than starting a blank shell.

## Continuity derivation strategy
Continuity notices remain grounded in real signals only:
- workspace continuity threads
- stored creative continuity preferences
- campaign approval/refinement history from persisted events

No synthetic AI personality or fake memory is added.

## Runtime persistence model
Client persistence now stores:
- active campaign id
- active and previous surfaces
- progression stage
- interruption reason
- return target
- updated timestamp

Persistence is local-storage based and loaded on runtime bootstrap to survive refresh and route interruptions.

## Transition choreography evolution
Runtime transitions now include restore-driven session bootstrap and route-origin mapping into active surfaces. The choreography remains restrained and continuity-first while preserving manual operations interruptions and recovery.

## Remaining gaps before full operator runtime
1. Inline review actions should post direct decision mutations with optimistic rollback semantics.
2. Publish/package and library inline surfaces still require deeper entity-bound mutation wiring.
3. Runtime restoration should eventually include server-validated stale-state detection for campaign archival/deletion edge cases.
