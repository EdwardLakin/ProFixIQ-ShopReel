"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/supabase";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";

type CampaignRow = Database["public"]["Tables"]["shopreel_campaigns"]["Row"];
type CampaignItemRow = Database["public"]["Tables"]["shopreel_campaign_items"]["Row"];

export default function CampaignDetailClient({
  campaign,
  items,
}: {
  campaign: CampaignRow;
  items: CampaignItemRow[];
}) {
  const router = useRouter();
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [batchWorking, setBatchWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createMediaJob(itemId: string) {
    try {
      setWorkingId(itemId);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/campaigns/items/${itemId}/create-job`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to create media job");
      }

      setMessage("Media job created from campaign item.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create media job");
    } finally {
      setWorkingId(null);
    }
  }

  async function createAllMediaJobs() {
    try {
      setBatchWorking(true);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/campaigns/${campaign.id}/create-all-jobs`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to create campaign jobs");
      }

      setMessage("Media jobs created for campaign.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign jobs");
    } finally {
      setBatchWorking(false);
    }
  }

  return (
    <GlassCard
      label="Angles"
      title="Campaign items"
      description="Each item becomes a video concept, media job, and content piece."
      strong
    >
      <div className="mb-4 flex flex-wrap gap-3">
        <GlassButton variant="primary" onClick={() => void createAllMediaJobs()} disabled={batchWorking}>
          {batchWorking ? "Creating..." : "Create All Media Jobs"}
        </GlassButton>
      </div>

      {message ? <div className={cx("mb-3 text-sm", glassTheme.text.copperSoft)}>{message}</div> : null}
      {error ? <div className={cx("mb-3 text-sm", glassTheme.text.copperSoft)}>{error}</div> : null}

      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={cx(
              "rounded-2xl border p-4",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                  {item.title}
                </div>
                <div className={cx("text-sm", glassTheme.text.secondary)}>
                  {item.angle}
                </div>
                <div className="flex flex-wrap gap-2">
                  <GlassBadge tone="default">{item.status}</GlassBadge>
                  <GlassBadge tone="muted">{item.aspect_ratio}</GlassBadge>
                  {item.style ? <GlassBadge tone="muted">{item.style}</GlassBadge> : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {!item.media_job_id ? (
                  <GlassButton
                    variant="secondary"
                    onClick={() => void createMediaJob(item.id)}
                    disabled={workingId === item.id}
                  >
                    {workingId === item.id ? "Creating..." : "Create Media Job"}
                  </GlassButton>
                ) : (
                  <GlassBadge tone="copper">Media job linked</GlassBadge>
                )}
              </div>
            </div>

            <div
              className={cx(
                "mt-4 rounded-2xl border p-4 text-sm whitespace-pre-wrap",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.primary
              )}
            >
              {item.prompt}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
