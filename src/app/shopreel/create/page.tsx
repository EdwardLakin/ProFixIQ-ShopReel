"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassInput from "@/features/shopreel/ui/system/GlassInput";
import GlassTextarea from "@/features/shopreel/ui/system/GlassTextarea";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import {
  DEFAULT_SHOPREEL_PLATFORM_IDS,
  SHOPREEL_PLATFORM_PRESETS,
  type ShopReelPlatformId,
} from "@/features/shopreel/platforms/presets";

type UploadFileMeta = { file: File; fileType: "image" | "video" };

function detectFileType(file: File): "image" | "video" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  throw new Error(`Unsupported file type: ${file.type}`);
}

export default function ShopReelCreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [audience, setAudience] = useState("");
  const [files, setFiles] = useState<UploadFileMeta[]>([]);
  const [platformIds, setPlatformIds] = useState<ShopReelPlatformId[]>(DEFAULT_SHOPREEL_PLATFORM_IDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSelectFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const next: UploadFileMeta[] = [];
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) continue;
      next.push({ file, fileType: detectFileType(file) });
    }
    setFiles(next);
  }

  function togglePlatform(platformId: ShopReelPlatformId) {
    setPlatformIds((current) =>
      current.includes(platformId) ? current.filter((id) => id !== platformId) : [...current, platformId],
    );
  }

  async function uploadAssetAndFiles() {
    const assetType = files.some((f) => f.fileType === "video")
      ? files.some((f) => f.fileType === "image")
        ? "mixed"
        : "video"
      : "image";

    const createRes = await fetch("/api/shopreel/manual-assets/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: prompt.slice(0, 120) || "ShopReel create upload",
        description: prompt,
        note: `Prompt-first create flow (${platformIds.join(",")})`,
        assetType,
        contentGoal: "promotion",
        platformTargets: platformIds,
        tags: ["shopreel_create"],
      }),
    });
    const createJson = await createRes.json();
    if (!createRes.ok) throw new Error(createJson.error ?? "Failed to create media asset");
    const assetId: string = createJson.assetId;

    const uploadedFiles = [];
    for (const item of files) {
      const signRes = await fetch("/api/shopreel/manual-assets/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId,
          fileName: item.file.name,
          mimeType: item.file.type,
          sizeBytes: item.file.size,
        }),
      });
      const signJson = await signRes.json();
      if (!signRes.ok) throw new Error(signJson.error ?? "Failed to sign upload");

      const uploadRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/shopreel-media/${signJson.path}?token=${signJson.token}`,
        {
          method: "PUT",
          headers: { "Content-Type": item.file.type, "x-upsert": "false" },
          body: item.file,
        },
      );
      if (!uploadRes.ok) throw new Error(`Upload failed for ${item.file.name}`);

      uploadedFiles.push({
        filePath: signJson.path,
        fileName: item.file.name,
        fileType: item.fileType,
        mimeType: item.file.type,
        sizeBytes: item.file.size,
      });
    }

    const completeRes = await fetch("/api/shopreel/manual-assets/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId,
        files: uploadedFiles.map((f, index) => ({ ...f, sortOrder: index })),
      }),
    });
    const completeJson = await completeRes.json();
    if (!completeRes.ok) throw new Error(completeJson.error ?? "Failed to finalize upload");

    return assetId;
  }

  async function handleSubmit() {
    try {
      setError(null);
      setIsSubmitting(true);
      if (!prompt.trim()) throw new Error("Prompt is required");
      if (!files.length) throw new Error("Upload at least one photo or video");
      if (!platformIds.length) throw new Error("Select at least one platform");

      const manualAssetId = await uploadAssetAndFiles();

      const createRes = await fetch("/api/shopreel/create/from-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          audience,
          platformIds,
          manualAssetId,
        }),
      });

      const createJson = await createRes.json();
      if (!createRes.ok || !createJson.ok) throw new Error(createJson.error ?? "Failed to create draft");

      router.push(createJson.reviewUrl ?? `/shopreel/review/${createJson.generationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <GlassShell eyebrow="ShopReel" title="Create" subtitle="Upload media, enter a prompt, choose platforms, and create a draft for review.">
      <ShopReelNav />
      <GlassCard label="Prompt-first" title="Create a draft" description="Canonical ShopReel create flow for Phase 1." strong>
        <GlassTextarea label="Prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Create a 20-second reel showing this repair before/after with a strong hook." />
        <GlassInput label="Audience" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Local homeowners" />

        <div className={cx("rounded-2xl border p-4", glassTheme.border.copper, glassTheme.glass.panelSoft)}>
          <div className={cx("mb-2 text-sm font-medium", glassTheme.text.primary)}>Upload media</div>
          <input type="file" multiple accept="image/*,video/*" onChange={(e) => onSelectFiles(e.target.files)} className={cx("block w-full text-sm", glassTheme.text.secondary)} />
          <div className="mt-3 flex flex-wrap gap-2">
            <GlassBadge tone="default">{files.length} files</GlassBadge>
          </div>
        </div>

        <div className="space-y-2">
          <div className={cx("text-sm font-medium", glassTheme.text.primary)}>Target platforms</div>
          <div className="grid gap-2 md:grid-cols-2">
            {SHOPREEL_PLATFORM_PRESETS.map((platform) => {
              const selected = platformIds.includes(platform.id);
              return (
                <label key={platform.id} className={cx("rounded-2xl border p-3 text-sm", selected ? glassTheme.border.copper : glassTheme.border.softer, glassTheme.glass.panelSoft, glassTheme.text.primary)}>
                  <input type="checkbox" checked={selected} onChange={() => togglePlatform(platform.id)} className="mr-2" />
                  {platform.label}
                </label>
              );
            })}
          </div>
        </div>

        {error ? <div className={cx("rounded-2xl border px-4 py-3 text-sm", glassTheme.border.copper, glassTheme.glass.panelSoft, glassTheme.text.copperSoft)}>{error}</div> : null}

        <GlassButton variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Creating draft..." : "Create draft"}
        </GlassButton>
      </GlassCard>
    </GlassShell>
  );
}
