"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/supabase";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";

type CampaignRow = Database["public"]["Tables"]["shopreel_campaigns"]["Row"];

function timeAgoLabel(value: string) {
  const now = Date.now();
  const then = new Date(value).getTime();
  const diffMs = Math.max(0, now - then);
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 60) return `${Math.max(diffMinutes, 1)}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago}`;

  return new Date(value).toLocaleDateString();
}

export default function CampaignGenerator({
  campaigns,
}: {
  campaigns: CampaignRow[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState("ShopReel vs Traditional Marketing");
  const [coreIdea, setCoreIdea] = useState(
    "Compare ShopReel to traditional marketing methods and introduce ShopReel as the future of business marketing."
  );
  const [audience, setAudience] = useState("Repair shops, local businesses, and creators");
  const [offer, setOffer] = useState("Turn real work into marketing automatically");
  const [campaignGoal, setCampaignGoal] = useState("Brand awareness and product introduction");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);

      const res = await fetch("/api/shopreel/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          coreIdea,
          audience,
          offer,
          campaignGoal,
          platformFocus: ["instagram", "facebook", "tiktok", "youtube"],
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to create campaign");
      }

      setMessage("Campaign created.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5">
      <GlassCard
        label="Campaign Builder"
        title="Generate a multi-video campaign"
        description="Take one strong idea and split it into multiple video angles automatically."
        strong
      >
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
              Campaign Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
            />
          </label>

          <label className="grid gap-2">
            <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
              Core Idea
            </span>
            <textarea
              value={coreIdea}
              onChange={(e) => setCoreIdea(e.target.value)}
              rows={5}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                Audience
              </span>
              <input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
              />
            </label>

            <label className="grid gap-2">
              <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                Offer
              </span>
              <input
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
              Campaign Goal
            </span>
            <input
              value={campaignGoal}
              onChange={(e) => setCampaignGoal(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <GlassButton variant="primary" onClick={() => void create()} disabled={submitting}>
              {submitting ? "Creating..." : "Create Campaign"}
            </GlassButton>
          </div>

          {message ? <div className={cx("text-sm", glassTheme.text.copperSoft)}>{message}</div> : null}
          {error ? <div className={cx("text-sm", glassTheme.text.copperSoft)}>{error}</div> : null}
        </div>
      </GlassCard>

      <GlassCard
        label="Recent"
        title="Recent campaigns"
        description="Campaigns created from one core idea."
        strong
      >
        {campaigns.length === 0 ? (
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft,
              glassTheme.text.secondary
            )}
          >
            No campaigns yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className={cx(
                  "rounded-2xl border p-4",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                      {campaign.title}
                    </div>
                    <div className={cx("text-sm", glassTheme.text.secondary)}>
                      {timeAgoLabel(campaign.created_at)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <GlassBadge tone="default">{campaign.status}</GlassBadge>
                      {(campaign.platform_focus ?? []).map((platform) => (
                        <GlassBadge key={platform} tone="muted">
                          {platform}
                        </GlassBadge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
