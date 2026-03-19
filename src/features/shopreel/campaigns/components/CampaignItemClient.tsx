"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";

type SceneRow = {
  id: string;
  title: string;
  prompt: string;
  status: string;
  scene_order: number;
  duration_seconds: number | null;
  media_job_id: string | null;
  output_asset_id?: string | null;
  media_job?: {
    id: string;
    status: string;
    output_asset_id: string | null;
    preview_url: string | null;
    error_text?: string | null;
  } | null;
};

type ItemRow = {
  id: string;
  campaign_id: string;
  title: string;
  angle: string;
  prompt: string;
  status: string;
  aspect_ratio: string;
  style: string | null;
  visual_mode: string | null;
  media_job_id: string | null;
  content_piece_id: string | null;
  metadata?: unknown;
};

function displayStatus(scene: SceneRow) {
  if (scene.media_job?.status) return scene.media_job.status;
  if (scene.media_job_id && scene.status === "draft") return "linked";
  return scene.status;
}

export default function CampaignItemClient({
  item,
  scenes,
}: {
  item: ItemRow;
  scenes: SceneRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(key: string, url: string) {
    try {
      setBusy(key);
      setError(null);

      const res = await fetch(url, { method: "POST" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error ?? `Failed action: ${key}`);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  const totalScenes = scenes.length;
  const completedScenes = scenes.filter(
    (scene) => displayStatus(scene) === "completed"
  ).length;
  const processingScenes = scenes.filter(
    (scene) => displayStatus(scene) === "processing"
  ).length;
  const queuedScenes = scenes.filter(
    (scene) => displayStatus(scene) === "queued"
  ).length;
  const linkedScenes = scenes.filter(
    (scene) => displayStatus(scene) === "linked"
  ).length;

  const progressPercent =
    totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0;

  return (
    <div className="grid gap-5">
      <GlassCard label="Item" title={item.title} description={item.prompt} strong>
        <div className="flex flex-wrap gap-2">
          <GlassBadge tone="default">{item.status}</GlassBadge>
          <GlassBadge tone="muted">{item.angle}</GlassBadge>
          <GlassBadge tone="muted">{item.aspect_ratio}</GlassBadge>
          {item.style ? <GlassBadge tone="muted">{item.style}</GlassBadge> : null}
          {item.visual_mode ? <GlassBadge tone="muted">{item.visual_mode}</GlassBadge> : null}
        </div>
      </GlassCard>

      <GlassCard label="Progress" title="Scene Progress" description="Track scene generation before final assembly." strong>
        <div className="space-y-4">
          <div className="text-3xl font-semibold text-white">{progressPercent}%</div>
          <div className="h-4 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300/80 via-blue-400/80 to-emerald-300/80 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-white/70">
            <span>{completedScenes} completed</span>
            <span>•</span>
            <span>{processingScenes} processing</span>
            <span>•</span>
            <span>{queuedScenes} queued</span>
            <span>•</span>
            <span>{linkedScenes} linked</span>
            <span>•</span>
            <span>{totalScenes} total scenes</span>
          </div>
        </div>
      </GlassCard>

      <GlassCard label="Actions" title="Item Flow" description="Run the multi-scene pipeline for this specific campaign item." strong>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <GlassButton
            variant="secondary"
            onClick={() => void runAction("create-scenes", `/api/shopreel/campaigns/items/${item.id}/create-scene-jobs`)}
            disabled={busy === "create-scenes"}
          >
            {busy === "create-scenes" ? "Working..." : "Create Scene Jobs"}
          </GlassButton>

          <GlassButton
            variant="secondary"
            onClick={() => void runAction("run-scenes", `/api/shopreel/campaigns/items/${item.id}/run-scene-jobs`)}
            disabled={busy === "run-scenes"}
          >
            {busy === "run-scenes" ? "Working..." : "Run Scene Jobs"}
          </GlassButton>

          <GlassButton
            variant="primary"
            onClick={() => void runAction("sync-scenes", `/api/shopreel/campaigns/items/${item.id}/sync-scene-jobs`)}
            disabled={busy === "sync-scenes"}
          >
            {busy === "sync-scenes" ? "Working..." : "Sync Scene Jobs"}
          </GlassButton>

          <GlassButton
            variant="primary"
            onClick={() => void runAction("assemble", `/api/shopreel/campaigns/items/${item.id}/assemble`)}
            disabled={busy === "assemble"}
          >
            {busy === "assemble" ? "Working..." : "Build 20s Final Ad"}
          </GlassButton>

          <Link href={`/shopreel/campaigns/${item.campaign_id}`}>
            <GlassButton variant="ghost">Back to Campaign</GlassButton>
          </Link>
        </div>

        {error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}
      </GlassCard>

      <GlassCard label="Scenes" title="Scene List" description="Each scene should get its own media job and then assemble into one final ad." strong>
        <div className="grid gap-3">
          {scenes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
              No scenes yet. Click <strong>Create Scene Jobs</strong>.
            </div>
          ) : (
            scenes.map((scene) => {
              const status = displayStatus(scene);

              return (
                <div key={scene.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="text-lg font-semibold text-white">
                        {scene.scene_order}. {scene.title}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <GlassBadge tone="default">{status}</GlassBadge>
                        {scene.duration_seconds ? (
                          <GlassBadge tone="muted">{scene.duration_seconds}s</GlassBadge>
                        ) : null}
                        {scene.media_job_id ? (
                          <GlassBadge tone="muted">Job linked</GlassBadge>
                        ) : (
                          <GlassBadge tone="muted">No job yet</GlassBadge>
                        )}
                        {scene.media_job?.output_asset_id ? (
                          <GlassBadge tone="copper">Asset ready</GlassBadge>
                        ) : null}
                      </div>

                      <div className="text-sm text-white/70">{scene.prompt}</div>
                      {scene.media_job?.error_text ? (
                        <div className="text-sm text-red-300">{scene.media_job.error_text}</div>
                      ) : null}
                    </div>

                    {scene.media_job?.preview_url ? (
                      <video
                        src={scene.media_job.preview_url}
                        controls
                        playsInline
                        className="h-44 rounded-2xl border border-white/10"
                      />
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>
    </div>
  );
}
