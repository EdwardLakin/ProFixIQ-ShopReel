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

const CONTENT_TYPES = [
  {
    title: "Short-form video",
    description: "Reels, TikToks, Shorts, launch clips, and teasers.",
  },
  {
    title: "Social post",
    description: "Platform-ready captions, carousels, and post concepts.",
  },
  {
    title: "Blog post",
    description: "Turn ideas or media into long-form written content.",
  },
  {
    title: "Campaign bundle",
    description: "Create a multi-channel content pack from one brief.",
  },
  {
    title: "Repurpose content",
    description: "Turn one asset into many formats for every channel.",
  },
  {
    title: "Custom",
    description: "Describe anything you want ShopReel to create.",
  },
] as const;

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
  const [platformIds, setPlatformIds] = useState<ShopReelPlatformId[]>(
    DEFAULT_SHOPREEL_PLATFORM_IDS,
  );
  const [selectedContentType, setSelectedContentType] = useState<string>("Short-form video");
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
      current.includes(platformId)
        ? current.filter((id) => id !== platformId)
        : [...current, platformId],
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
        tags: ["shopreel_create", selectedContentType.toLowerCase().replaceAll(" ", "_")],
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
          contentType: selectedContentType,
        }),
      });

      const createJson = await createRes.json();
      if (!createRes.ok || !createJson.ok) {
        throw new Error(createJson.error ?? "Failed to create draft");
      }

      router.push(createJson.reviewUrl ?? `/shopreel/review/${createJson.generationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Create content from anything"
      subtitle="Upload media, describe the outcome, choose your channels, and let ShopReel build the first draft."
    >
      <ShopReelNav />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <GlassCard
            label="AI brief"
            title="What are you creating?"
            description="Start with a format, then add media and direction. ShopReel will shape the draft for your selected channels."
            strong
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {CONTENT_TYPES.map((type) => {
                const selected = selectedContentType === type.title;

                return (
                  <button
                    key={type.title}
                    type="button"
                    onClick={() => setSelectedContentType(type.title)}
                    className={cx(
                      "rounded-2xl border p-4 text-left transition hover:-translate-y-0.5",
                      selected ? glassTheme.border.copper : glassTheme.border.softer,
                      selected ? "bg-white/[0.08]" : glassTheme.glass.panelSoft,
                    )}
                  >
                    <div className={cx("text-sm font-semibold", glassTheme.text.primary)}>
                      {type.title}
                    </div>
                    <p className={cx("mt-2 text-xs leading-5", glassTheme.text.secondary)}>
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard
            label="Source"
            title="Add source material"
            description="Upload photos or videos. The current MVP is manual-upload first, built for fast one-off creation."
            strong
          >
            <div
              className={cx(
                "rounded-3xl border border-dashed p-6",
                glassTheme.border.copper,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className={cx("text-base font-semibold", glassTheme.text.primary)}>
                    Upload media
                  </div>
                  <p className={cx("mt-1 text-sm", glassTheme.text.secondary)}>
                    Add clips, product shots, behind-the-scenes footage, screenshots, or raw ideas.
                  </p>
                </div>

                <label
                  className={cx(
                    "inline-flex cursor-pointer items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                    glassTheme.text.primary,
                  )}
                >
                  Choose files
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => onSelectFiles(e.target.files)}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <GlassBadge tone="default">{files.length} files selected</GlassBadge>
                {files.slice(0, 4).map((item) => (
                  <GlassBadge key={`${item.file.name}-${item.file.size}`} tone="default">
                    {item.file.name}
                  </GlassBadge>
                ))}
                {files.length > 4 ? (
                  <GlassBadge tone="default">+{files.length - 4} more</GlassBadge>
                ) : null}
              </div>
            </div>
          </GlassCard>

          <GlassCard
            label="Direction"
            title="Describe the outcome"
            description="Tell ShopReel what you want the content to do, who it is for, and what style it should have."
            strong
          >
            <GlassTextarea
              label="Prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Create a 30-second product launch reel for Instagram with upbeat music, captions, and a strong opening hook."
            />

            <GlassInput
              label="Audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Creators, small business owners, customers, local buyers, subscribers..."
            />
          </GlassCard>

          <GlassCard
            label="Channels"
            title="Choose platforms"
            description="Pick where this draft should be shaped for. Only currently supported outputs are active."
            strong
          >
            <div className="grid gap-3 md:grid-cols-2">
              {SHOPREEL_PLATFORM_PRESETS.map((platform) => {
                const selected = platformIds.includes(platform.id);

                return (
                  <label
                    key={platform.id}
                    className={cx(
                      "flex cursor-pointer items-center justify-between rounded-2xl border p-4 text-sm transition hover:-translate-y-0.5",
                      selected ? glassTheme.border.copper : glassTheme.border.softer,
                      selected ? "bg-white/[0.08]" : glassTheme.glass.panelSoft,
                      glassTheme.text.primary,
                    )}
                  >
                    <span>{platform.label}</span>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => togglePlatform(platform.id)}
                      className="h-4 w-4"
                    />
                  </label>
                );
              })}
            </div>

            {error ? (
              <div
                className={cx(
                  "rounded-2xl border px-4 py-3 text-sm",
                  glassTheme.border.copper,
                  glassTheme.glass.panelSoft,
                  glassTheme.text.copperSoft,
                )}
              >
                {error}
              </div>
            ) : null}

            <GlassButton variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Generating draft..." : "Generate draft"}
            </GlassButton>
          </GlassCard>
        </div>

        <aside className="space-y-4">
          <GlassCard
            label="How it works"
            title="Manual upload → AI draft"
            description="This MVP is built for fast creation from your own media. Upload assets, write the brief, and review the generated draft before rendering or export."
            strong
          >
            <div className="space-y-3">
              {[
                "Upload raw media",
                "Describe the goal",
                "Choose target channels",
                "Generate a reviewable draft",
              ].map((step, index) => (
                <div
                  key={step}
                  className={cx(
                    "flex items-center gap-3 rounded-2xl border p-3",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                  )}
                >
                  <div
                    className={cx(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                      glassTheme.glass.panel,
                      glassTheme.text.primary,
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className={cx("text-sm", glassTheme.text.primary)}>{step}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard
            label="Prompt ideas"
            title="Start with this"
            description="Use these patterns for stronger first drafts."
          >
            <div className="space-y-2">
              {[
                "Turn this product demo into a launch reel.",
                "Create a founder-style short from these notes.",
                "Repurpose this clip into captions and a blog outline.",
                "Make a clean promo post with a strong CTA.",
              ].map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => setPrompt(idea)}
                  className={cx(
                    "w-full rounded-2xl border p-3 text-left text-sm transition hover:bg-white/[0.08]",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                    glassTheme.text.secondary,
                  )}
                >
                  {idea}
                </button>
              ))}
            </div>
          </GlassCard>
        </aside>
      </div>
    </GlassShell>
  );
}
