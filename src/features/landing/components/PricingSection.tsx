"use client";

import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { BILLING_PLANS, type BillingPlan } from "@/features/billing/plans";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

const PLAN_ORDER: BillingPlan[] = ["starter", "growth", "unlimited"];

async function startCheckout(plan: BillingPlan) {
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
}

export default function PricingSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
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
          Every plan includes every feature
        </h2>
        <p
          className={cx(
            "mt-4 text-base leading-7 md:text-lg",
            glassTheme.text.secondary,
          )}
        >
          ShopReel scales by output volume, not by locking features behind
          higher tiers.
        </p>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {PLAN_ORDER.map((planKey) => {
          const plan = BILLING_PLANS[planKey];
          const highlight = plan.key === "growth";

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
                >
                  Start {plan.name}
                </GlassButton>
              }
            >
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {plan.badge ? (
                    <GlassBadge tone="copper">{plan.badge}</GlassBadge>
                  ) : null}
                  <GlassBadge tone="default">
                    {typeof plan.generationLimit === "number"
                      ? `${plan.generationLimit} generations / month`
                      : "Unlimited generations"}
                  </GlassBadge>
                </div>

                <div className={cx("space-y-2 text-sm", glassTheme.text.primary)}>
                  <div>All creator outputs</div>
                  <div>Content calendar</div>
                  <div>Automation loop</div>
                  <div>Publishing workflow</div>
                  <div>Performance learning</div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}