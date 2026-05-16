# ShopReel Notifications + Stripe Checkout/Onboarding Audit

Date: 2026-05-06
Repo: `/workspace/ProFixIQ-ShopReel`
Scope: Notifications, Stripe/billing, onboarding/signup/login integration

## 0) Scope confirmation (per AGENTS.md)
- Active repository is `ProFixIQ-ShopReel` and this repo is treated as the canonical ShopReel product surface.
- Canonical user-facing auth/onboarding routes found:
  - `/signup` (`src/app/signup/page.tsx`)
  - `/login` (`src/app/login/page.tsx`)
  - `/onboarding` (`src/app/onboarding/page.tsx`)
  - `/shopreel/*` product routes.
- Canonical billing API surfaces found:
  - `POST /api/billing/checkout`
  - `POST /api/billing/portal`
  - `POST /api/billing/webhook`
- This repo has partial lifecycle maturity for billing + notifications:
  - Billing backend pieces exist and are wired to Stripe APIs.
  - Billing is **not surfaced in signup/login/onboarding UI**, and gating is inconsistent.
  - No first-class in-app notification system exists.

---

## 1) Notifications audit

### 1.1 Does any notification table exist?
- No dedicated notification table exists in migrations.
- Existing event tables (`content_events`, `content_analytics_events`) are domain telemetry/content history, not user notification inboxes.
- No schema fields like `read_at`, `recipient_user_id`, `notification_type`, `delivery_state` found.

### 1.2 Does any UI bell/dropdown exist?
- No bell icon, inbox dropdown, or notifications center route was found.
- No reusable notification component/module exists.
- No toast framework usage found (`toast` search returns no notification system usage).

### 1.3 Are job/export/publish failures surfaced anywhere?
- Failures are visible in **workflow-specific pages/components** (render/publish/video tooling surfaces) through status badges/messages.
- This means users only see failure states by visiting those operational pages.
- There is no cross-app push/inbox notification for:
  - render failed
  - publish failed
  - export ready
  - automation failures

### 1.4 Are video completion/failure states only visible by visiting queue pages?
- Practically yes. Completion/failure visibility is localized to queue/studio/history views.
- No global, asynchronous inbox/notification abstraction currently elevates these events to a unified user feed.

### 1.5 Events that should emit notifications now (MVP)
Recommended MVP event catalog:
1. `render.completed`
2. `render.failed`
3. `export.ready`
4. `export.failed`
5. `publish.succeeded`
6. `publish.failed`
7. `billing.subscription_past_due`
8. `billing.subscription_canceled`
9. `automation.run_failed`
10. `automation.requires_attention`

Each event should include:
- `shop_id`
- optional `user_id` recipient (or broadcast scope)
- entity refs (`generation_id`, `publication_id`, `export_id`, etc.)
- message payload
- `read_at` + `created_at`

### 1.6 Smallest schema/API/UI implementation (notifications)

**Schema (minimum):**
- `shopreel_notifications`
  - `id uuid pk`
  - `shop_id uuid not null`
  - `user_id uuid null` (null = shop-wide)
  - `type text not null`
  - `title text not null`
  - `body text null`
  - `severity text not null check (info|success|warning|error)`
  - `entity_type text null`
  - `entity_id uuid null`
  - `action_href text null`
  - `read_at timestamptz null`
  - `created_at timestamptz not null default now()`
- indexes: `(shop_id, created_at desc)`, `(user_id, read_at, created_at desc)`

**API (minimum):**
- `GET /api/shopreel/notifications?unreadOnly=...&limit=...`
- `POST /api/shopreel/notifications/read` (single + bulk)
- server helper `emitNotification(...)` reused by publish/render/export workers.

**UI (minimum):**
- Bell in ShopReel nav with unread count.
- Dropdown recent notifications with action links.
- “Mark all read” + fallback `/shopreel/notifications` page.

Maturity classification:
- current: **aspirational/unwired** for first-class notifications.

---

## 2) Stripe/billing audit

### 2.1 What Stripe routes exist?
- `POST /api/billing/checkout` exists and creates Stripe Checkout sessions.
- `POST /api/billing/webhook` exists and processes subscription lifecycle webhooks.
- `POST /api/billing/portal` exists and creates billing portal sessions.

### 2.2 Is there a checkout session route?
- Yes. `src/app/api/billing/checkout/route.ts`.

### 2.3 Is there a webhook route?
- Yes. `src/app/api/billing/webhook/route.ts`.

### 2.4 Is there a customer portal route?
- Yes. `src/app/api/billing/portal/route.ts`.

### 2.5 Are env vars documented?
- Environment variables are referenced in code:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_STARTER`
  - `STRIPE_PRICE_GROWTH`
  - `STRIPE_PRICE_UNLIMITED`
- `.env.example` is missing in the checked scope, so discoverability/documentation is weak.

### 2.6 Are price IDs/lookup keys present?
- Price IDs are expected via env vars above.
- No Stripe `lookup_key` usage found.

### 2.7 Is there a plan selection UI?
- Yes, but currently on landing pricing component (`src/features/landing/components/PricingSection.tsx`), not tightly integrated into authenticated onboarding.

### 2.8 Is signup/login connected to billing?
- No direct billing step in signup/login.
- Signup redirects to `/onboarding` after email confirmation; onboarding page has no billing step.

### 2.9 Is checkout gated by plan/trial state?
- Partial only.
- `assertGenerationAllowed` enforces active/trialing state **if subscription exists**, but explicitly allows usage when subscription is null.
- This creates weak/partial gate behavior for premium actions.

### 2.10 Is ShopReel using ProFixIQ billing assumptions?
- Billing keys primarily on `shop_id` (not user subscription ownership).
- `getCurrentShopId` can resolve via membership, fallback settings row, then `DEFAULT_SHOP_ID`; this implies tenant-centric assumptions and fallback behavior that can blur standalone user ownership.

### 2.11 Does billing require shop_id?
- Yes, core billing tables and APIs are shop-scoped (`shopreel_subscriptions.shop_id` unique and required).

### 2.12 Does standalone ShopReel user billing work?
- Partially.
- Stripe API mechanics exist, but UX path is incomplete and current model is strongly shop-scoped. No explicit standalone user billing lifecycle is visible in auth onboarding.

Maturity classification:
- API layer: **implemented and partially trusted**
- onboarding + gating + ownership UX: **partial**

---

## 3) Desired Stripe behavior (MVP recommendation)

### Option A
Signup/Login → Plan selection → Stripe checkout → ShopReel

Pros:
- Clean monetization funnel.
- Immediate billing qualification.
- Clear plan commitment before product use.

Cons:
- Higher signup friction.
- Harder activation for users wanting product preview first.

### Option B
Signup/Login → First-run preview → Gate export/video behind trial/checkout

Pros:
- Better activation and trust (see product value first).
- Natural conversion trigger at high-intent actions.

Cons:
- Requires robust billing gates and entitlement checks across premium actions.

### Recommendation
**Recommend Option B for ShopReel MVP**:
- Keep low-friction onboarding.
- Gate high-cost/value actions (render/export/publish at scale, automation) behind trial/checkout.
- Add obvious upgrade CTAs where user intent is highest.

---

## 4) Required schema audit

### Existing billing tables
- `shopreel_subscriptions` (has `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`, `plan`, `status`, `period_start`, `period_end`, limits).
- `shopreel_usage_periods` (usage tracking by period).

### Missing or incomplete fields/contracts for target behavior
- `trial_end` (explicit) missing.
- canonical `current_period_end` naming (today uses `period_end`; acceptable but naming can be normalized).
- explicit entitlement snapshot table (optional but useful).
- clear user linkage strategy (`user_id`) if per-user notifications/billing ownership is needed beyond shop scope.

### Plan enum drift issue
- Migration constraint allows plans `starter|creator|pro`.
- Runtime code uses `starter|growth|unlimited`.
- This is a correctness risk: webhook/checkout upserts may fail or drift depending on DB constraint state.

---

## 5) Required APIs (recommended exact routes)

### Billing
1. `POST /api/billing/checkout` (exists; keep, harden errors + auth assumptions)
2. `GET /api/billing/status` (new)
   - returns subscription, trial, entitlement, usage, gating flags
3. `POST /api/billing/portal` (exists)
4. `POST /api/billing/webhook` (exists; add idempotency/event logging)
5. `GET /api/billing/plans` (new; single source of truth for plan cards + entitlements)

### Notifications
1. `GET /api/shopreel/notifications`
2. `POST /api/shopreel/notifications/read`
3. optional: `GET /api/shopreel/notifications/unread-count`

---

## 6) Required UI (recommended exact surfaces)

### Billing UI
1. `/shopreel/billing` plan selection + current plan + usage
2. Account/Settings billing card (status, renewal/trial end, manage billing)
3. Billing gate component for premium actions:
   - “Start trial” / “Upgrade” CTA
   - clear reason/action blocked
4. Checkout error state banner/toast on billing page and action gate return paths.

### Notification UI
1. Global bell in ShopReel nav.
2. Dropdown recent items, unread badges, action deep links.
3. Dedicated `/shopreel/notifications` page for full history.

---

## 7) File-level recommendations

### Notifications
**Likely files to modify:**
- `src/features/shopreel/ui/ShopReelNav.tsx` (bell + unread)
- relevant worker modules to emit events (render/publish/export automation workers)

**Likely new files:**
- `src/app/api/shopreel/notifications/route.ts`
- `src/app/api/shopreel/notifications/read/route.ts`
- `src/features/notifications/*` (DTOs/service helpers)
- `src/app/shopreel/notifications/page.tsx`

**Migrations needed:**
- create `shopreel_notifications` + indexes + RLS policies.

**Risk level:** Medium.
**Expected user impact:** High (faster awareness, less missed failures, better trust).

### Stripe/Billing
**Likely files to modify:**
- `src/app/signup/page.tsx`
- `src/app/login/page.tsx`
- `src/app/onboarding/page.tsx`
- `src/features/billing/assertGenerationAllowed.ts`
- premium action entry points (render/export/publish starts)
- settings/account pages for billing card.

**Likely new files:**
- `src/app/shopreel/billing/page.tsx`
- `src/app/api/billing/status/route.ts`
- `src/app/api/billing/plans/route.ts`
- shared billing gate UI component.

**Migrations needed:**
- normalize plan enum (`growth/unlimited` decision or map layer)
- optional `trial_end` field
- optional billing event log table for webhook idempotency/audit.

**Risk level:** Medium-High (payment + entitlement logic).
**Expected user impact:** Very High (revenue capture + clear onboarding path).

---

## 8) Final implementation plan

### A) Notifications MVP
1. Add notifications table + RLS.
2. Add emit helper and wire core events (render/export/publish/billing failures).
3. Add bell + unread count + dropdown.
4. Add notifications page + read/mark-all-read endpoints.

### B) Stripe checkout fix
1. Add authenticated billing status endpoint.
2. Add `/shopreel/billing` with plan selection + checkout start.
3. Surface billing in onboarding with explicit step/CTA.
4. Harden webhook handling (idempotency + better resolution/logging).
5. Resolve plan enum drift between DB and runtime.

### C) Billing gates
1. Identify premium actions (render/export/publish automation).
2. Apply shared gating component + server-side entitlement check.
3. Keep non-premium preview path available (Option B).

### D) Future polish
1. Trial lifecycle UX (trial countdown, grace period messaging).
2. Email/push notifications.
3. Billing analytics funnel instrumentation.
4. Admin diagnostics for failed webhooks and unresolved customer mappings.

---

## Direct answer to reported problem
You did not see Stripe checkout during signup/login because this codebase currently does **not** place a billing step in `/signup`, `/login`, or `/onboarding`. Checkout exists, but it is triggered from pricing surfaces/API calls rather than embedded in auth onboarding flow.
