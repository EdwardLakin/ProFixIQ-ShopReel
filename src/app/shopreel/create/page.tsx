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
import { DEFAULT_SHOPREEL_PLATFORM_IDS, SHOPREEL_PLATFORM_PRESETS, type ShopReelPlatformId } from "@/features/shopreel/platforms/presets";

type UploadFileMeta = { file: File; fileType: "image" | "video" };
const CONTENT_TYPES = [
  { title: "Short-form video", description: "Reels, Shorts, TikToks, launch clips, and founder moments." },
  { title: "Social post", description: "Hooks, captions, carousels, and CTA-led static content." },
  { title: "Blog post", description: "Long-form drafts from notes, product media, or transcripts." },
  { title: "Campaign bundle", description: "Multi-channel assets with one audience and one message." },
  { title: "Repurpose content", description: "Convert one source file into many content formats." },
  { title: "Custom", description: "Describe exactly what outcome you want from ShopReel." },
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
  const [platformIds, setPlatformIds] = useState<ShopReelPlatformId[]>(DEFAULT_SHOPREEL_PLATFORM_IDS);
  const [selectedContentType, setSelectedContentType] = useState<string>("Short-form video");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSelectFiles(fileList: FileList | null) { if (!fileList?.length) return; const next: UploadFileMeta[] = []; for (const file of Array.from(fileList)) { if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) continue; next.push({ file, fileType: detectFileType(file) }); } setFiles(next); }
  function togglePlatform(platformId: ShopReelPlatformId) { setPlatformIds((current) => current.includes(platformId) ? current.filter((id) => id !== platformId) : [...current, platformId]); }

  async function uploadAssetAndFiles() {
    const assetType = files.some((f) => f.fileType === "video") ? (files.some((f) => f.fileType === "image") ? "mixed" : "video") : "image";
    const createRes = await fetch("/api/shopreel/manual-assets/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: prompt.slice(0, 120) || "ShopReel create upload", description: prompt, note: `Prompt-first create flow (${platformIds.join(",")})`, assetType, contentGoal: "promotion", platformTargets: platformIds, tags: ["shopreel_create", selectedContentType.toLowerCase().replaceAll(" ", "_")] }) });
    const createJson = await createRes.json(); if (!createRes.ok) throw new Error(createJson.error ?? "Failed to create media asset");
    const assetId: string = createJson.assetId; const uploadedFiles = [];
    for (const item of files) {
      const signRes = await fetch("/api/shopreel/manual-assets/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assetId, fileName: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size }) });
      const signJson = await signRes.json(); if (!signRes.ok) throw new Error(signJson.error ?? "Failed to sign upload");
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/shopreel-media/${signJson.path}?token=${signJson.token}`, { method: "PUT", headers: { "Content-Type": item.file.type, "x-upsert": "false" }, body: item.file });
      if (!uploadRes.ok) throw new Error(`Upload failed for ${item.file.name}`);
      uploadedFiles.push({ filePath: signJson.path, fileName: item.file.name, fileType: item.fileType, mimeType: item.file.type, sizeBytes: item.file.size });
    }
    const completeRes = await fetch("/api/shopreel/manual-assets/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assetId, files: uploadedFiles.map((f, index) => ({ ...f, sortOrder: index })) }) });
    const completeJson = await completeRes.json(); if (!completeRes.ok) throw new Error(completeJson.error ?? "Failed to finalize upload");
    return assetId;
  }

  async function handleSubmit() {
    try {
      setError(null); setIsSubmitting(true);
      if (!prompt.trim()) throw new Error("Prompt is required");
      if (!files.length) throw new Error("Upload at least one photo or video");
      if (!platformIds.length) throw new Error("Select at least one platform");
      const manualAssetId = await uploadAssetAndFiles();
      const createRes = await fetch("/api/shopreel/create/from-idea", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, audience, platformIds, manualAssetId, contentType: selectedContentType }) });
      const createJson = await createRes.json();
      if (!createRes.ok || !createJson.ok) throw new Error(createJson.error ?? "Failed to create draft");
      router.push(createJson.reviewUrl ?? `/shopreel/review/${createJson.generationId}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to create"); }
    finally { setIsSubmitting(false); }
  }

  return (
    <GlassShell eyebrow="Creation studio" title="Create with AI + your media" subtitle="Manual upload flow for MVP: brief once, choose channels, generate a draft, then review before render/export.">
      <ShopReelNav />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-violet-300/20 bg-[radial-gradient(circle_at_12%_0%,rgba(122,92,255,0.3),transparent_40%),linear-gradient(140deg,rgba(8,12,29,0.95),rgba(7,11,26,0.86))] p-5 md:p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-100/60">Guided flow</div>
            <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Build your next piece in one focused flow</h2>
            <p className="mt-2 text-sm text-white/75">Manual upload → prompt/brief → platform selection → create draft → review/edit → render/export.</p>
          </section>

          <GlassCard label="Step 1" title="Choose output type" description="Select the format first so ShopReel structures the draft appropriately." strong>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {CONTENT_TYPES.map((type) => {
                const selected = selectedContentType === type.title;
                return (
                  <button key={type.title} type="button" onClick={() => setSelectedContentType(type.title)} className={cx("rounded-2xl border p-4 text-left transition hover:-translate-y-0.5", selected ? "border-violet-300/35 bg-violet-500/12" : glassTheme.border.softer, selected ? "shadow-[0_10px_35px_rgba(94,71,255,0.2)]" : glassTheme.glass.panelSoft)}>
                    <div className={cx("text-sm font-semibold", glassTheme.text.primary)}>{type.title}</div>
                    <p className={cx("mt-2 text-xs leading-5", glassTheme.text.secondary)}>{type.description}</p>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard label="Step 2" title="Add source media" description="Upload photos/videos to ground draft quality in real product or creator context." strong>
            <div className={cx("rounded-3xl border border-dashed p-6", glassTheme.border.copper, glassTheme.glass.panelSoft)}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><div className={cx("text-base font-semibold", glassTheme.text.primary)}>Upload media</div><p className={cx("mt-1 text-sm", glassTheme.text.secondary)}>Add product clips, founder footage, testimonials, screenshots, or image libraries.</p></div>
                <label className={cx("inline-flex cursor-pointer items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold", glassTheme.border.softer, glassTheme.glass.panelSoft, glassTheme.text.primary)}>Choose files<input type="file" multiple accept="image/*,video/*" onChange={(e) => onSelectFiles(e.target.files)} className="sr-only" /></label></div>
              <div className="mt-4 flex flex-wrap gap-2"><GlassBadge tone="default">{files.length} files selected</GlassBadge>{files.slice(0, 4).map((item) => <GlassBadge key={`${item.file.name}-${item.file.size}`} tone="default">{item.file.name}</GlassBadge>)}{files.length > 4 ? <GlassBadge tone="default">+{files.length - 4} more</GlassBadge> : null}</div>
            </div>
          </GlassCard>

          <GlassCard label="Step 3" title="Write the brief" description="Define outcome, angle, and audience to shape the first draft." strong>
            <GlassTextarea label="Prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Create a 30-second product launch reel for Instagram with upbeat music, captions, and a strong opening hook." />
            <GlassInput label="Audience" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Creators, founders, local buyers, B2B marketers, returning customers..." />
          </GlassCard>

          <GlassCard label="Step 4" title="Select platforms" description="Choose where to optimize outputs. Only supported channels are active in this MVP." strong>
            <div className="grid gap-3 md:grid-cols-2">{SHOPREEL_PLATFORM_PRESETS.map((platform) => { const selected = platformIds.includes(platform.id); return <label key={platform.id} className={cx("flex cursor-pointer items-center justify-between rounded-2xl border p-4 text-sm transition hover:-translate-y-0.5", selected ? "border-cyan-300/35 bg-cyan-400/10" : glassTheme.border.softer, selected ? "shadow-[0_10px_30px_rgba(53,170,255,0.16)]" : glassTheme.glass.panelSoft, glassTheme.text.primary)}><span>{platform.label}</span><input type="checkbox" checked={selected} onChange={() => togglePlatform(platform.id)} className="h-4 w-4" /></label>; })}</div>
            {error ? <div className={cx("rounded-2xl border px-4 py-3 text-sm", glassTheme.border.copper, glassTheme.glass.panelSoft, glassTheme.text.copperSoft)}>{error}</div> : null}
            <GlassButton variant="primary" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Generating draft..." : "Create draft"}</GlassButton>
          </GlassCard>
        </div>

        <aside className="space-y-4">
          <GlassCard label="Studio guide" title="MVP flow truth" description="Current implementation is manual-upload first with real draft generation and review handoff.">
            <div className="space-y-3">{["Upload raw media", "Write prompt + audience", "Select channels", "Generate draft", "Review/edit", "Render/export"].map((step, index) => <div key={step} className={cx("flex items-center gap-3 rounded-2xl border p-3", glassTheme.border.softer, glassTheme.glass.panelSoft)}><div className={cx("flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold", glassTheme.glass.panel, glassTheme.text.primary)}>{index + 1}</div><div className={cx("text-sm", glassTheme.text.primary)}>{step}</div></div>)}</div>
          </GlassCard>

          <GlassCard label="Prompt ideas" title="Quick starters" description="Use these to speed up the first draft.">
            <div className="space-y-2">{["Turn this product demo into a launch reel with 3 hook variants.", "Create a founder-style short with captions and bold CTA.", "Repurpose this clip into an Instagram post + blog intro.", "Make a clean promo post with benefit-first copy."].map((idea) => <button key={idea} type="button" onClick={() => setPrompt(idea)} className={cx("w-full rounded-2xl border p-3 text-left text-sm transition hover:bg-white/[0.08]", glassTheme.border.softer, glassTheme.glass.panelSoft, glassTheme.text.secondary)}>{idea}</button>)}</div>
          </GlassCard>
        </aside>
      </div>
    </GlassShell>
  );
}
