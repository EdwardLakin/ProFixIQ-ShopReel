"use client";

import { useState } from "react";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { BILLING_PLANS, type BillingPlan } from "@/features/billing/plans";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

const PLAN_ORDER: BillingPlan[] = ["starter", "growth", "unlimited"];

export default function PricingSection() {
  const [loadingPlan, setLoadingPlan] = useState<BillingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: BillingPlan) {
    try {
      setError(null);
      setLoadingPlan(plan);

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const json = (await res.json()) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };

      if (!res.ok || !json.ok || !json.url) {
        throw new Error(json.error ?? "Failed to start checkout");
      }

      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <section id="pricing" className="relative mx-auto w-full max-w-7xl px-6 py-24">
      <div className="pointer-events-none absolute inset-x-0 top-8 mx-auto h-72 max-w-4xl rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-3xl text-center">
        <div
          className={cx(
            "text-sm uppercase tracking-[0.28em]",
            glassTheme.text.copperSoft,
          )}
        >
          Pricing
        </div>

        <h2
          className={cx(
            "mt-4 text-4xl font-semibold md:text-5xl",
            glassTheme.text.primary,
          )}
        >
          Plans built for every content rhythm.
        </h2>

        <p
          className={cx(
            "mt-4 text-base leading-7 md:text-lg",
            glassTheme.text.secondary,
          )}
        >
          Every plan includes ShopReel’s core AI creation flow. Scale up when you need
          more output, video creation, asset learning, and automation.
        </p>
      </div>

      {error ? (
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="relative mt-12 grid gap-5 lg:grid-cols-3">
        {PLAN_ORDER.map((planKey) => {
          const plan = BILLING_PLANS[planKey];
          const highlight = plan.key === "growth";
          const isLoading = loadingPlan === plan.key;

          return (
            <GlassCard
              key={plan.key}
              label={plan.name}
              title={`$${plan.monthlyPrice}/mo`}
              description={plan.description}
              strong={highlight}
              footer={
                <GlassButton
                  variant={highlight ? "primary" : "secondary"}
                  onClick={() => void startCheckout(plan.key)}
                  disabled={loadingPlan !== null}
                >
                  {isLoading ? "Redirecting..." : `Start ${plan.name}`}
                </GlassButton>
              }
            >
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  {plan.badge ? (
                    <GlassBadge tone="copper">{plan.badge}</GlassBadge>
                  ) : null}
                  <GlassBadge tone="default">{plan.fairUseLabel}</GlassBadge>
                </div>

                <p className="text-sm text-white/65">{plan.bestFor}</p>

                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">
                    Included
                  </div>
                  <div className={cx("space-y-2 text-sm", glassTheme.text.primary)}>
                    {plan.includedFeatures.map((feature) => (
                      <div key={feature}>✓ {feature}</div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">
                    Scales with
                  </div>
                  <div className="space-y-2 text-sm text-white/65">
                    {plan.premiumFeatures.map((feature) => (
                      <div key={feature}>→ {feature}</div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}
