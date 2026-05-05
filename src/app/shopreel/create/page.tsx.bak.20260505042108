"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

type CreateType = "Short-form video" | "Social post" | "Blog post" | "Campaign bundle" | "Repurpose content" | "Custom";

const CREATE_TYPES: CreateType[] = ["Short-form video", "Social post", "Blog post", "Campaign bundle", "Repurpose content", "Custom"];

function detectFileType(file: File): "image" | "video" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  throw new Error(`Unsupported file type: ${file.type}`);
}

export default function ShopReelCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const template = searchParams.get("template") ?? "";
  const [prompt, setPrompt] = useState(template);
  const [audience, setAudience] = useState("");
  const [createType, setCreateType] = useState<CreateType>("Short-form video");
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
        note: `${createType} create flow (${platformIds.join(",")})`,
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
      if (!prompt.trim()) throw new Error("Describe what you want to create");
      if (!files.length) throw new Error("Add at least one photo or video to continue");
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
    <GlassShell eyebrow="ShopReel" title="Create" subtitle="Manual upload → describe outcome → choose platforms → generate draft.">
      <ShopReelNav />
      <div className="space-y-4">
        <GlassCard label="Step 1" title="What are you creating?" description="Pick a format to shape structure and output style.">
          <div className="grid gap-2 md:grid-cols-3">
            {CREATE_TYPES.map((type) => {
              const selected = createType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCreateType(type)}
                  className={cx(
                    "rounded-xl border px-3 py-3 text-left text-sm transition",
                    selected ? "border-white/25 bg-white/[0.09] text-white" : "border-white/10 bg-white/[0.02] text-white/75 hover:bg-white/[0.06]",
                  )}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard label="Step 2" title="Add source material" description="Upload product clips, UGC, screenshots, or brand media.">
          <div className={cx("rounded-2xl border p-5", glassTheme.border.copper, "bg-gradient-to-br from-white/[0.05] to-transparent")}>
            <div className={cx("text-sm font-medium", glassTheme.text.primary)}>Upload media</div>
            <div className={cx("mt-1 text-sm", glassTheme.text.secondary)}>Add images or videos. File handling remains unchanged from the current MVP flow.</div>
            <input type="file" multiple accept="image/*,video/*" onChange={(e) => onSelectFiles(e.target.files)} className={cx("mt-4 block w-full text-sm", glassTheme.text.secondary)} />
            <div className="mt-3 flex flex-wrap gap-2">
              <GlassBadge tone="default">{files.length} files selected</GlassBadge>
            </div>
          </div>
        </GlassCard>

        <GlassCard label="Step 3" title="Describe the outcome" description="Tell the AI what to create, for whom, and with what intent.">
          <GlassTextarea
            label="Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the final result: format, message, pacing, hook, CTA, and visual style. Example: Create a product launch reel with a bold opening hook, fast cuts, captions, and a clean CTA."
          />
          <GlassInput label="Audience" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Creators, founders, customers, or marketing teams" />
        </GlassCard>

        <GlassCard label="Step 4" title="Choose platforms" description="Select where this content should be optimized for distribution.">
          <div className="grid gap-2 md:grid-cols-2">
            {SHOPREEL_PLATFORM_PRESETS.map((platform) => {
              const selected = platformIds.includes(platform.id);
              return (
                <label
                  key={platform.id}
                  className={cx(
                    "rounded-2xl border p-3 text-sm transition",
                    selected ? "border-white/25 bg-white/[0.09] text-white" : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.07]",
                  )}
                >
                  <input type="checkbox" checked={selected} onChange={() => togglePlatform(platform.id)} className="mr-2" />
                  {platform.label}
                </label>
              );
            })}
          </div>
        </GlassCard>

        {error ? (
          <div className={cx("rounded-2xl border px-4 py-3 text-sm", glassTheme.border.copper, glassTheme.glass.panelSoft, glassTheme.text.copperSoft)}>
            {error}
          </div>
        ) : null}

        <div className="flex justify-end">
          <GlassButton variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Generating draft..." : "Generate draft"}
          </GlassButton>
        </div>
      </div>
    </GlassShell>
  );
}
