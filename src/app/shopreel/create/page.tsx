"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import { DEFAULT_SHOPREEL_PLATFORM_IDS, SHOPREEL_PLATFORM_PRESETS, type ShopReelPlatformId } from "@/features/shopreel/platforms/presets";

type UploadFileMeta = { file: File; fileType: "image" | "video" };

type CreatePrefillPayload = {
  prompt?: string;
  audience?: string;
  contentType?: string;
  source?: string;
  angleTitle?: string;
  angleHook?: string;
  angleCta?: string;
  createdAt?: number;
};
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
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [prefillNotice, setPrefillNotice] = useState<string | null>(null);


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storedRaw = window.localStorage.getItem("shopreel:createPrefill");

    let stored: CreatePrefillPayload | null = null;
    if (storedRaw) {
      try {
        stored = JSON.parse(storedRaw) as CreatePrefillPayload;
      } catch {
        stored = null;
      }
    }

    const promptFromParams = params.get("prompt");
    const audienceFromParams = params.get("audience");
    const contentTypeFromParams = params.get("contentType");
    const sourceFromParams = params.get("source");

    const nextPrompt = promptFromParams || stored?.prompt || "";
    const nextAudience = audienceFromParams || stored?.audience || "";
    const nextContentType = contentTypeFromParams || stored?.contentType || "";

    if (nextPrompt && !prompt.trim()) {
      setPrompt(nextPrompt);
    }

    if (nextAudience && !audience.trim()) {
      setAudience(nextAudience);
    }

    if (nextContentType && CONTENT_TYPES.some((item) => item.title === nextContentType)) {
      setSelectedContentType(nextContentType);
    }

    const source = sourceFromParams || stored?.source;
    if (nextPrompt && source === "ideas") {
      setPrefillNotice("Loaded from Ideas Chat. Upload media, confirm platforms, and generate the draft.");
    }
  }, [audience, prompt]);

  function onSelectFiles(fileList: FileList | null) { if (!fileList?.length) return; const next: UploadFileMeta[] = []; let unsupportedCount = 0; for (const file of Array.from(fileList)) { if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) { unsupportedCount += 1; continue; } next.push({ file, fileType: detectFileType(file) }); } setFiles(next); setUploadNotice(unsupportedCount > 0 ? `${unsupportedCount} unsupported file${unsupportedCount === 1 ? "" : "s"} skipped. Use images or videos only.` : null); }
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
    <GlassShell eyebrow="Create" title="Create your next piece of content" subtitle="Guided studio flow: choose format, upload media, brief AI, select channels, then generate draft.">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="space-y-4">
          {prefillNotice ? (
            <div className="rounded-2xl border border-cyan-300/25 bg-cyan-400/[0.07] px-4 py-3 text-sm text-cyan-50">
              {prefillNotice}
            </div>
          ) : null}
          <section className="rounded-[30px] border border-violet-300/25 bg-[radial-gradient(circle_at_12%_0%,rgba(122,92,255,0.34),transparent_40%),linear-gradient(140deg,rgba(8,12,29,0.95),rgba(7,11,26,0.86))] p-5">
            <div className="text-xs tracking-[0.2em] text-cyan-100/65">GUIDED STUDIO</div>
            <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Build from one brief to one generated draft</h2>
            <p className="mt-2 text-sm text-white/75">Upload source media, describe the outcome, set audience and channels, then hand off to review.</p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 text-sm font-semibold text-white">Step 1 · Choose format</div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {CONTENT_TYPES.map((type) => {
                const selected = selectedContentType === type.title;
                return (
                  <button key={type.title} type="button" onClick={() => setSelectedContentType(type.title)} className={cx("rounded-2xl border p-4 text-left transition hover:-translate-y-0.5", selected ? "border-violet-300/35 bg-violet-500/12 shadow-[0_10px_35px_rgba(94,71,255,0.22)]" : "border-white/10 bg-black/20", glassTheme.text.primary)}>
                    <div className="text-sm font-semibold">{type.title}</div>
                    <p className="mt-2 text-xs leading-5 text-white/70">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 text-sm font-semibold text-white">Step 2 · Upload media</div>
            <label className="block cursor-pointer rounded-3xl border border-dashed border-violet-300/35 bg-black/25 p-5">
              <div className="text-lg font-semibold text-white">Drop media or choose files</div>
              <div className="mt-1 text-sm text-white/70">Photos and videos are used as source truth for generation quality.</div>
              <div className="mt-1 text-xs text-cyan-100/75">Best for screenshot-led launches (PayProof, SaaS, app updates), offers, and creator-brand campaigns.</div>
              <div className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/[0.08] px-4 py-2 text-sm text-white">Choose files</div>
              <input type="file" multiple accept="image/*,video/*" onChange={(e) => onSelectFiles(e.target.files)} className="sr-only" />
            </label>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">{files.length} files selected</span>
              {files.slice(0, 4).map((item) => <span key={`${item.file.name}-${item.file.size}`} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">{item.file.name}</span>)}
            </div>
            {uploadNotice ? <div className="mt-2 text-xs text-amber-200">{uploadNotice}</div> : null}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 text-sm font-semibold text-white">Step 3 · Describe outcome</div>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Create a 30-second product launch reel for Instagram with upbeat music, captions, and a strong opening hook." className="min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-violet-300/40" />
            <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Audience: founders, creators, local shoppers, B2B marketers..." className="mt-3 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-cyan-300/40" />
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 text-sm font-semibold text-white">Step 4 · Choose platforms</div>
            <p className="mb-3 text-xs text-white/65">For this MVP, select Instagram and Facebook to generate platform-specific post copy you can review, copy, and download.</p>
            <div className="grid gap-3 md:grid-cols-2">
              {SHOPREEL_PLATFORM_PRESETS.map((platform) => {
                const selected = platformIds.includes(platform.id);
                return (
                  <label key={platform.id} className={cx("flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm transition", selected ? "border-cyan-300/35 bg-cyan-500/12 text-white" : "border-white/10 bg-black/20 text-white/85")}>
                    <span>{platform.label}</span>
                    <input type="checkbox" checked={selected} onChange={() => togglePlatform(platform.id)} className="h-4 w-4" />
                  </label>
                );
              })}
            </div>
            {error ? <div className="mt-4 rounded-xl border border-rose-300/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
            <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="mt-4 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_35px_rgba(99,82,255,0.4)] disabled:opacity-70">{isSubmitting ? "Generating draft..." : "Generate draft"}</button>
          </section>
        </section>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm font-semibold text-white">Brief summary</div>
            <div className="mt-3 space-y-2 text-sm text-white/75">
              <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">Format: {selectedContentType}</div>
              <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">Files: {files.length}</div>
              <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">Platforms: {platformIds.length}</div>
              <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">Audience: {audience || "Not set"}</div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm font-semibold text-white">Tips for stronger output</div>
            <div className="mt-3 space-y-2 text-sm text-white/70">
              <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">Lead with one clear outcome and one CTA.</div>
              <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">Use creator-style pacing cues (hook, proof, close).</div>
              <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">Keep prompt specific to platform behavior.</div>
            </div>
          </div>
        </aside>
      </div>
    </GlassShell>
  );
}
