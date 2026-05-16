# ShopReel Notifications + Stripe Summary (Paste-Friendly)

## TL;DR
- **Notifications:** No first-class in-app notifications system exists yet (no notification table, no bell/inbox UI, no read/unread model).
- **Stripe:** Core Stripe APIs exist (`checkout`, `webhook`, `portal`), but billing is **not integrated into signup/login/onboarding UX**, which explains why checkout was never seen during auth flow.
- **Gating:** Billing gates are partial/inconsistent; some generation paths can proceed without an existing subscription record.

## What exists today

### Notifications
- No `shopreel_notifications` table.
- No bell dropdown or notifications center page.
- Failures/completions are mostly visible only inside operational pages (render/publish/video queues).

### Stripe/Billing
- Existing routes:
  - `POST /api/billing/checkout`
  - `POST /api/billing/webhook`
  - `POST /api/billing/portal`
- Env usage in code includes:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_UNLIMITED`
- Plan selection UI exists on pricing section, not in onboarding/auth.
- Billing data is shop-scoped (`shop_id`), not a clear standalone user-first billing flow.

## Why checkout is not seen in signup/login
- `/signup` and `/login` only handle auth.
- `/onboarding` is setup guidance and has no billing step.
- Checkout is triggered elsewhere (pricing flow/API), not automatically during auth onboarding.

## Key risks found
1. **Plan enum drift**:
   - DB migration constraint includes `starter|creator|pro`
   - Runtime code uses `starter|growth|unlimited`
2. **Entitlement gap**:
   - Generation guard allows behavior when no subscription row exists (`subscription === null` path), leading to soft gates.
3. **No centralized user notification channel**:
   - Users can miss important failures unless they open specific queue/history pages.

## Recommended Stripe MVP flow
**Recommend Option B**
- Signup/Login → first-run preview
- Gate premium actions (render/export/publish automation volume) behind trial/checkout

Why:
- Lower onboarding friction and better activation.
- Converts users at high-intent moments.
- Matches current architecture better than forcing checkout before product exposure.

## Minimum implementation needed (no code yet)

### Notifications MVP
1. Add `shopreel_notifications` table (`shop_id`, optional `user_id`, `type`, `title`, `body`, `severity`, `entity refs`, `read_at`, timestamps).
2. Add APIs:
   - `GET /api/shopreel/notifications`
   - `POST /api/shopreel/notifications/read`
3. Add UI:
   - bell with unread count
   - dropdown recent events
   - `/shopreel/notifications` page
4. Emit events for:
   - render completed/failed
   - export ready/failed
   - publish failed/succeeded
   - billing past_due/canceled

### Stripe fix
1. Add `/shopreel/billing` page (plan + current status + usage).
2. Add `GET /api/billing/status` and `GET /api/billing/plans`.
3. Add onboarding billing step/CTA.
4. Normalize plan contract (DB + runtime).
5. Harden webhook idempotency/audit.

### Billing gates
- Add shared billing gate component for premium actions.
- Ensure server-side entitlement checks are consistent across render/export/publish entry points.

## Outcome if implemented
- Users reliably see failures/completions without hunting queue pages.
- Stripe checkout is discoverable and conversion-oriented.
- Billing behavior becomes predictable, auditable, and aligned with ShopReel as a first-class product.
