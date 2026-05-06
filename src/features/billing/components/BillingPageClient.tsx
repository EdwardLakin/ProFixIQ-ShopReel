"use client";

import { useEffect, useMemo, useState } from "react";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";

type Plan = {
  key: "starter" | "growth" | "unlimited";
  name: string;
  description: string;
  bestFor: string;
  monthlyPrice: number;
  generationLimit: number | null;
  fairUseLabel: string;
  badge: string | null;
  includedFeatures: string[];
  premiumFeatures: string[];
  stripeConfigured: boolean;
};

type BillingStatus = {
  subscription: {
    plan?: string | null;
    status?: string | null;
    period_end?: string | null;
    cancel_at_period_end?: boolean | null;
  } | null;
  usage: {
    used?: number | null;
    limit?: number | null;
    remaining?: number | null;
  } | null;
  entitlement: {
    status: string;
    canPreview: boolean;
    canExport: boolean;
    canRender: boolean;
    canPublish: boolean;
    needsCheckout: boolean;
    message: string;
  };
};

const PLAN_ORDER = ["starter", "growth", "unlimited"] as const;

function formatPeriod(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export default function BillingPageClient() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderedPlans = useMemo(
    () =>
      [...plans].sort(
        (a, b) => PLAN_ORDER.indexOf(a.key) - PLAN_ORDER.indexOf(b.key),
      ),
    [plans],
  );

  async function loadBilling() {
    setError(null);

    const [plansRes, statusRes] = await Promise.all([
      fetch("/api/billing/plans", { cache: "no-store" }),
      fetch("/api/billing/status", { cache: "no-store" }),
    ]);

    const plansJson = (await plansRes.json()) as { ok?: boolean; plans?: Plan[]; error?: string };
    const statusJson = (await statusRes.json()) as { ok?: boolean; error?: string } & BillingStatus;

    if (!plansRes.ok || !plansJson.ok) throw new Error(plansJson.error ?? "Failed to load plans");
    if (!statusRes.ok || !statusJson.ok) throw new Error(statusJson.error ?? "Failed to load billing status");

    setPlans(plansJson.plans ?? []);
    setStatus(statusJson);
  }

  useEffect(() => {
    void loadBilling().catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to load billing.");
    });
  }, []);

  async function startCheckout(plan: Plan["key"]) {
    try {
      setError(null);
      setLoadingPlan(plan);

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const json = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !json.ok || !json.url) throw new Error(json.error ?? "Failed to start checkout");

      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout.");
    } finally {
      setLoadingPlan(null);
    }
  }

  async function openPortal() {
    try {
      setError(null);
      setPortalLoading(true);

      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !json.ok || !json.url) throw new Error(json.error ?? "Failed to open billing portal");

      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open billing portal.");
    } finally {
      setPortalLoading(false);
    }
  }

  const currentPlan = status?.subscription?.plan ?? null;
  const subscriptionStatus = status?.subscription?.status ?? "none";
  const currentPlanConfig = plans.find((plan) => plan.key === currentPlan);
  const usageLabel =
    currentPlanConfig?.generationLimit === null
      ? "Unlimited fair use"
      : typeof status?.usage?.limit === "number"
        ? `${status?.usage?.used ?? 0} / ${status.usage.limit}`
        : currentPlanConfig?.fairUseLabel ?? `${status?.usage?.used ?? 0}`;

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <GlassCard label="Billing status" title="Your ShopReel access" strong>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <div className="text-xs uppercase tracking-[0.16em] text-white/45">Status</div>
            <div className="mt-2 text-lg font-semibold text-white">{subscriptionStatus}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <div className="text-xs uppercase tracking-[0.16em] text-white/45">Plan</div>
            <div className="mt-2 text-lg font-semibold text-white">{currentPlan ?? "Preview"}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <div className="text-xs uppercase tracking-[0.16em] text-white/45">Period ends</div>
            <div className="mt-2 text-lg font-semibold text-white">{formatPeriod(status?.subscription?.period_end)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <div className="text-xs uppercase tracking-[0.16em] text-white/45">Generation usage</div>
            <div className="mt-2 text-lg font-semibold text-white">{usageLabel}</div>
          </div>
        </div>

        <p className="mt-4 text-sm text-white/70">
          {status?.entitlement.message ?? "Load billing status to see current access."}
        </p>

        {status?.subscription ? (
          <div className="mt-4">
            <GlassButton variant="ghost" onClick={openPortal} disabled={portalLoading}>
              {portalLoading ? "Opening..." : "Manage billing"}
            </GlassButton>
          </div>
        ) : null}
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-3">
        {orderedPlans.map((plan) => {
          const active = currentPlan === plan.key;
          const highlighted = plan.key === "growth";
          const isLoading = loadingPlan === plan.key;

          return (
            <GlassCard
              key={plan.key}
              label={plan.name}
              title={`$${plan.monthlyPrice}/mo`}
              description={plan.description}
              strong={highlighted}
            >
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {plan.badge ? <GlassBadge tone="copper">{plan.badge}</GlassBadge> : null}
                  {active ? <GlassBadge tone="default">Current plan</GlassBadge> : null}
                  {!plan.stripeConfigured ? <GlassBadge tone="muted">Missing Stripe price</GlassBadge> : null}
                </div>

                <div className="space-y-4 text-sm text-white/78">
                  <div className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80">
                    {plan.fairUseLabel}
                  </div>

                  <div>
                    <div className="mb-2 text-xs uppercase tracking-[0.16em] text-white/45">Included</div>
                    <div className="space-y-1.5">
                      {plan.includedFeatures.map((feature) => (
                        <div key={feature}>✓ {feature}</div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-xs uppercase tracking-[0.16em] text-white/45">Scales with</div>
                    <div className="space-y-1.5 text-white/65">
                      {plan.premiumFeatures.map((feature) => (
                        <div key={feature}>→ {feature}</div>
                      ))}
                    </div>
                  </div>
                </div>

                <GlassButton
                  onClick={() => void startCheckout(plan.key)}
                  disabled={Boolean(loadingPlan) || active || !plan.stripeConfigured}
                >
                  {active ? "Current plan" : isLoading ? "Redirecting..." : `Start ${plan.name}`}
                </GlassButton>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
