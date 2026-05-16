"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Database } from "@/types/supabase";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import { consumeCampaignCommandHandoff } from "@/features/shopreel/ui/system/campaignCommandHandoff";
import type { CampaignMode, ParsedCampaignBrief } from "@/features/shopreel/campaigns/lib/campaignIntakeTypes";
import { parseCampaignIntake } from "@/features/shopreel/campaigns/lib/parseCampaignIntake";

type CampaignRow = Database["public"]["Tables"]["shopreel_campaigns"]["Row"] & {
  items?: Array<{
    id: string;
    status: string;
    final_output_asset_id: string | null;
    created_at: string;
  }> | null;
  production_summary?: {
    totalItems: number;
    finalReadyItems: number;
    totalScenes: number;
    queuedScenes: number;
    processingScenes: number;
    completedScenes: number;
    failedScenes: number;
    stageLabel: string;
  };
};


const MODE_LABELS: Record<CampaignMode, string> = {
  business_advertising: "Business Advertising",
  launch_campaign: "Launch Campaign",
  weekly_content: "Weekly Content",
  uploaded_asset: "Uploaded Asset",
  campaign_refine: "Campaign Refine",
  publish_learning: "Publish + Learning",
  internal_self_marketing: "Internal Self-Marketing",
  general_campaign: "General Campaign",
};

function timeAgoLabel(value: string) {
  const now = Date.now();
  const then = new Date(value).getTime();
  const diffMs = Math.max(0, now - then);
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 60) return `${Math.max(diffMinutes, 1)}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(value).toLocaleDateString();
}

function getCampaignReviewHref(campaignId: string) {
  return `/shopreel/campaigns/${campaignId}/review`;
}

function getCampaignProductionHref(campaignId: string, campaign: CampaignRow) {
  const items = (campaign.items ?? []).slice();
  if (items.length === 0) return `/shopreel/campaigns/${campaignId}`;

  const sortByCreatedAt = (a: { created_at: string }, b: { created_at: string }) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

  const firstActiveItem = items
    .filter((item) => !item.final_output_asset_id)
    .sort(sortByCreatedAt)[0];

  const primaryItem = firstActiveItem ?? items.sort(sortByCreatedAt)[0];

  return primaryItem ? `/shopreel/campaigns/items/${primaryItem.id}` : `/shopreel/campaigns/${campaignId}`;
}

function getDisplayStageLabel(campaign: CampaignRow) {
  const summary = campaign.production_summary;
  const normalizedStatus = campaign.status.toLowerCase();

  if (summary) {
    if (summary.finalReadyItems > 0 && summary.finalReadyItems === summary.totalItems && summary.totalItems > 0) {
      return "Final ready";
    }

    if (summary.totalScenes > 0 && summary.completedScenes === summary.totalScenes) {
      return "Ready to assemble";
    }

    if (summary.processingScenes > 0) {
      return "Generating";
    }

    if (summary.finalReadyItems > 0 && summary.finalReadyItems < summary.totalItems) {
      return "Partially ready";
    }

    if (summary.queuedScenes > 0 && summary.processingScenes === 0 && summary.finalReadyItems === 0) {
      return "Frames queued";
    }

    if (summary.totalItems > 0) {
      return "Storyboard ready";
    }
  }

  if (normalizedStatus === "published") return "Published";
  if (normalizedStatus === "ready") return "Ready";
  if (normalizedStatus === "processing") return "Generating";

  return "Brief";
}

function getStageTone(stageLabel: string) {
  const normalized = stageLabel.toLowerCase();

  if (normalized.includes("final")) return "copper" as const;
  if (normalized.includes("assemble")) return "copper" as const;
  if (normalized.includes("generating")) return "default" as const;
  if (normalized.includes("started")) return "muted" as const;
  if (normalized.includes("ready")) return "default" as const;
  if (normalized.includes("published")) return "copper" as const;

  return "default" as const;
}

function getPrimaryAction(campaign: CampaignRow) {
  const stageLabel = getDisplayStageLabel(campaign);

  if (stageLabel === "Brief") {
    return {
      href: getCampaignReviewHref(campaign.id),
      label: "Review",
      variant: "secondary" as const,
    };
  }

  return {
    href: getCampaignProductionHref(campaign.id, campaign),
    label: "Production",
    variant: "primary" as const,
  };
}

export default function CampaignGenerator({
  campaigns,
  seedDefaults,
}: {
  campaigns: CampaignRow[];
  seedDefaults: {
    winningAngles: string[];
    suggestedHook: string | null;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handoffId = useMemo(() => searchParams.get("handoff")?.trim() ?? "", [searchParams]);
  const modeParam = useMemo(() => searchParams.get("mode"), [searchParams]);
  const fallbackPrompt = useMemo(() => searchParams.get("prompt")?.trim() ?? "", [searchParams]);
  const [promptFromCommand, setPromptFromCommand] = useState("");
  const [parsedBrief, setParsedBrief] = useState<ParsedCampaignBrief | null>(null);
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const [hasInitializedFromPrompt, setHasInitializedFromPrompt] = useState(false);
  const creatingFromPrompt = modeParam === "create" && promptFromCommand.length > 0;



  useEffect(() => {
    if (modeParam !== "create") return;
    if (hasInitializedFromPrompt) return;

    if (handoffId) {
      const handoff = consumeCampaignCommandHandoff(handoffId);
      if (!handoff) {
        setHandoffError("Campaign handoff expired before loading. Paste the prompt again to generate a new campaign brief.");
        if (fallbackPrompt) setPromptFromCommand(fallbackPrompt);
        console.info("[ShopReelRouteTrace]", { handoffId, handoffMethod: "session_storage", campaignPrefillStatus: "handoff_missing" });
        return;
      }
      const prompt = handoff.prompt.trim();
      setPromptFromCommand(prompt);
      setParsedBrief(handoff.parsedBrief ?? parseCampaignIntake(prompt));
      setHandoffError(null);
      setHasInitializedFromPrompt(true);
      console.info("[ShopReelRouteTrace]", { handoffId, handoffMethod: "session_storage", campaignPrefillStatus: "handoff_loaded", promptLength: handoff.prompt.length });
      return;
    }

    if (fallbackPrompt) {
      setPromptFromCommand(fallbackPrompt);
      setParsedBrief(parseCampaignIntake(fallbackPrompt));
      setHasInitializedFromPrompt(true);
      console.info("[ShopReelRouteTrace]", { handoffMethod: "query_fallback", campaignPrefillStatus: "fallback_loaded", promptLength: fallbackPrompt.length });
    }
  }, [fallbackPrompt, handoffId, hasInitializedFromPrompt, modeParam]);
  const [title, setTitle] = useState("ShopReel vs Traditional Marketing");
  const [coreIdea, setCoreIdea] = useState(
    `Compare ShopReel to traditional marketing methods and introduce ShopReel as the future of business marketing.${seedDefaults.suggestedHook ? ` ${seedDefaults.suggestedHook}.` : ""}`
  );
  const [audience, setAudience] = useState("Repair shops, local businesses, and creators");
  const [offer, setOffer] = useState("Turn real work into marketing automatically");
  const [campaignGoal, setCampaignGoal] = useState("Brand awareness and product introduction");
  const [productContext, setProductContext] = useState("");
  const [tone, setTone] = useState("Confident and practical");
  const [platformFocus, setPlatformFocus] = useState("instagram, facebook, tiktok, youtube");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!creatingFromPrompt || hasInitializedFromPrompt) return;
    const prompt = promptFromCommand;
    const brief = parsedBrief ?? parseCampaignIntake(prompt);
    const shortTitle = prompt.split(/[.!?\n]/)[0]?.replace(/^build\s+/i, "").trim() ?? "New Campaign";

    setTitle(shortTitle.slice(0, 100));
    setCoreIdea(prompt);
    setAudience(brief.audience ?? "");
    setOffer(brief.offer ?? "");
    setCampaignGoal(brief.goal ?? "Awareness and conversions");
    setProductContext(brief.productName ?? brief.businessName ?? brief.businessType ?? "");
    setTone(brief.tone ?? "Confident and practical");
    if (brief.platformFocus.length > 0) setPlatformFocus(brief.platformFocus.join(", "));
    if (!parsedBrief) setParsedBrief(brief);
    setHasInitializedFromPrompt(true);
  }, [creatingFromPrompt, hasInitializedFromPrompt, parsedBrief, promptFromCommand]);

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
          platformFocus: platformFocus.split(",").map((p) => p.trim().toLowerCase()).filter(Boolean),
          campaignBrain: {
            campaignObjective: campaignGoal || null,
            targetAudience: audience || null,
            channelPriorities: platformFocus.split(",").map((p) => p.trim().toLowerCase()).filter(Boolean),
            contentPillars: [],
            experimentHypotheses: [],
            successSignals: creatingFromPrompt ? [promptFromCommand] : [],
            intakeNotes: parsedBrief?.notes ?? [],
            parsedBrief: parsedBrief ?? undefined,
          },
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to create campaign");
      }

      const campaignId = json.id ?? json.campaign?.id ?? json.data?.id ?? null;

      if (!campaignId) {
        throw new Error("Campaign created but no campaign id was returned");
      }

      router.push(`/shopreel/campaigns/${campaignId}/review`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4 lg:gap-5 min-w-0">
      <GlassCard
        label="Campaign Brief"
        title="Start with the campaign idea"
        description="Describe what you want to promote, who it is for, and what outcome you want. You’ll review the campaign before production starts."
        strong
      >
        {seedDefaults.winningAngles.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {seedDefaults.winningAngles.map((angle) => (
              <GlassBadge key={angle} tone="copper">
                Learned winner: {angle}
              </GlassBadge>
            ))}
          </div>
        ) : null}

        <div className="grid gap-3.5 min-w-0">
          {creatingFromPrompt ? <div className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-50 break-words">New campaign detected · Campaign brief generated from your prompt.</div> : null}
          {promptFromCommand ? <div className="rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-50 break-words">Source prompt context preserved ({promptFromCommand.length} chars).</div> : null}
          {parsedBrief ? <div className="rounded-xl border border-violet-300/30 bg-violet-400/10 px-3 py-2 text-xs text-violet-50 break-words whitespace-pre-wrap">ShopReel detected: {MODE_LABELS[parsedBrief.mode]} · confidence {(parsedBrief.confidence * 100).toFixed(0)}%<br/>Recommended outputs: {parsedBrief.desiredOutputs.join(", ") || "n/a"}<br/>Missing questions: {parsedBrief.missingQuestions.join(" | ") || "none"}</div> : null}
          {handoffError ? <div className="rounded-xl border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-100 break-words">{handoffError}</div> : null}
          <label className="grid gap-2">
            <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
              Campaign Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-white outline-none transition focus:border-cyan-300/45"
            />
          </label>

          <label className="grid gap-2">
            <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>Product / Brand Context</span>
            <input value={productContext} onChange={(e) => setProductContext(e.target.value)} className="rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-white outline-none transition focus:border-cyan-300/45" />
          </label>

          <label className="grid gap-2">
            <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>Tone</span>
            <input value={tone} onChange={(e) => setTone(e.target.value)} className="rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-white outline-none transition focus:border-cyan-300/45" />
          </label>

          <label className="grid gap-2">
            <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>Platforms</span>
            <input value={platformFocus} onChange={(e) => setPlatformFocus(e.target.value)} className="rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-white outline-none transition focus:border-cyan-300/45" />
          </label>

          <label className="grid gap-2">
            <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
              Core Idea
            </span>
            <textarea
              value={coreIdea}
              onChange={(e) => setCoreIdea(e.target.value)}
              rows={4}
              className="rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-white outline-none transition focus:border-cyan-300/45"
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
                className="rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-white outline-none transition focus:border-cyan-300/45"
              />
            </label>

            <label className="grid gap-2">
              <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                Offer
              </span>
              <input
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                className="rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-white outline-none transition focus:border-cyan-300/45"
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
              className="rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-white outline-none transition focus:border-cyan-300/45"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <GlassButton className="min-h-11 w-full sm:w-auto sm:min-w-[220px] shadow-[0_14px_34px_rgba(88,99,255,0.38)]" variant="primary" onClick={() => void create()} disabled={submitting}>
              {submitting ? "Creating..." : "Create campaign workspace"}
            </GlassButton>
          </div>

          {message ? <div className={cx("text-sm", glassTheme.text.copperSoft)}>{message}</div> : null}
          {error ? <div className={cx("text-sm", glassTheme.text.copperSoft)}>{error}</div> : null}
        </div>
      </GlassCard>

      <GlassCard
        label="Recent"
        title="Recent campaigns"
        description="Start a campaign or jump back into one you were already working on."
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
          <div className="grid gap-3 min-w-0">
            {campaigns.map((campaign) => {
              const summary = campaign.production_summary;
              const itemCount = summary?.totalItems ?? campaign.items?.length ?? 0;
              const primaryAction = getPrimaryAction(campaign);
              const stageLabel = getDisplayStageLabel(campaign);

              return (
                <div
                  key={campaign.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="grid gap-4 min-w-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={getCampaignReviewHref(campaign.id)}
                          className={cx(
                            "text-base font-medium underline-offset-4 hover:underline",
                            glassTheme.text.primary
                          )}
                        >
                          {campaign.title}
                        </Link>
                      </div>

                      <div className={cx("text-sm", glassTheme.text.secondary)}>
                        {timeAgoLabel(campaign.created_at)}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <GlassBadge tone={getStageTone(stageLabel)}>
                          {stageLabel}
                        </GlassBadge>
                        <GlassBadge tone="copper">{itemCount} videos</GlassBadge>
                        {(campaign.platform_focus ?? []).map((platform) => (
                          <GlassBadge key={platform} tone="muted">
                            {platform}
                          </GlassBadge>
                        ))}
                      </div>

                      {summary ? (
                        <div className="flex flex-wrap gap-2 text-xs text-white/55">
                          <span>{summary.finalReadyItems} frames ready</span>
                          <span>•</span>
                          <span>{summary.processingScenes} processing</span>
                          <span>•</span>
                          <span>{summary.queuedScenes} queued</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
                      <Link href={primaryAction.href}>
                        <GlassButton variant={primaryAction.variant}>
                          {primaryAction.label}
                        </GlassButton>
                      </Link>
                      <Link href={primaryAction.href}>
                        <GlassButton variant="ghost">Open</GlassButton>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
