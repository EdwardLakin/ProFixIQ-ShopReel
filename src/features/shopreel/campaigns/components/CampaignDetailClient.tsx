"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { isActiveMediaStatus, normalizeMediaStatus, readMediaMetadata, type CampaignImagePurpose } from "@/features/shopreel/campaigns/lib/mediaGeneration";

type CampaignRow = { id: string; title: string; core_idea: string; audience: string | null; offer: string | null; campaign_goal: string | null; status: string; platform_focus: string[]; created_at: string; metadata?: unknown };
type CampaignItemRow = { id: string; title: string; angle: string; prompt: string; status: string; aspect_ratio: string; style: string | null; visual_mode: string | null; media_job_id: string | null; final_output_asset_id?: string | null; metadata?: unknown };
type AdaptiveMemory = { learnedNotices: string[]; tasteSummary: string[]; continuityNotice: string | null };
type ApprovalTask = { id: string; status: string; title: string; details: string | null; confidence: number | null; requires_approval: boolean };
type ParsedBriefView = { mode?: string; sourcePrompt?: string; desiredOutputs?: string[]; missingQuestions?: string[]; businessType?: string; serviceCategory?: string; location?: string; targetCustomer?: string; offer?: string; bookingAction?: string };
type CampaignPackage = { mode?: string; sections?: Record<string, string | string[]> };

type Stage = "missing_info" | "choose_angle" | "review_package" | "approve_package" | "copy_export" | "media";
const questionHints: Record<string, string> = { "what is your business name?": "Example: Calgary Mobile Mechanic", "do you have an intro offer?": "Example: Free first inspection with booking", "what trust signal can we use?": "Example: 10 years experience, licensed, insured" };
const pkgCards = [
  ["facebook_post", "Facebook Post", "Paste this as a Facebook post."],
  ["comment_reply_templates", "Comment Reply Templates", "Use these when people comment asking price/location/availability."],
  ["short_reel_script", "Short Reel Script", "Use this as a shot list for a simple phone video."],
  ["local_ad_copy", "Local Ad Copy", "Use this in local Facebook ads or boosted posts."],
  ["cta_options", "CTA Options", "Use one CTA in your post ending or ad button text."],
  ["follow_up_post_ideas", "Follow-up Post Ideas", "Use these for next week follow-up content."]
] as const;

const normalize = (v: string | string[]) => Array.isArray(v) ? v.map((x) => `• ${x}`).join("\n") : v;
const copyText = (value: string) => navigator.clipboard.writeText(value);

export default function CampaignDetailClient({ campaign, items, progress, adaptiveMemory }: { campaign: CampaignRow; items: CampaignItemRow[]; progress: { totalItems: number; completedItems: number; progressPercent: number; totalScenes: number; queuedScenes: number; processingScenes: number; completedScenes: number; failedScenes: number }; adaptiveMemory: AdaptiveMemory }) {
  const router = useRouter();
  const packageRef = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [runTasks, setRunTasks] = useState<Record<string, ApprovalTask[]>>({});
  const [packageState, setPackageState] = useState<Record<string, { productionPackage?: CampaignPackage; status?: string; message?: string; itemId?: string }>>({});
  const [sessionNotice, setSessionNotice] = useState<string>("");
  const [confirmation, setConfirmation] = useState<string>("");
  const [missingAnswers, setMissingAnswers] = useState<Record<string, string>>({});
  const [appliedBrief, setAppliedBrief] = useState<ParsedBriefView | null>(null);
  const [mediaBusy, setMediaBusy] = useState<string | null>(null);
  const [mediaStateByItem, setMediaStateByItem] = useState<Record<string, any>>({});
  const [imagePurposeByItem, setImagePurposeByItem] = useState<Record<string, CampaignImagePurpose>>({});

  const campaignMetadata = (campaign.metadata && typeof campaign.metadata === "object" ? campaign.metadata : {}) as Record<string, unknown>;
  const parsedBrief = (campaignMetadata.parsed_brief && typeof campaignMetadata.parsed_brief === "object" ? campaignMetadata.parsed_brief : {}) as ParsedBriefView;
  const brief = appliedBrief ?? parsedBrief;
  const pendingMissing = brief.missingQuestions ?? [];

  useEffect(() => { void (async () => {
    const runsRes = await fetch(`/api/shopreel/agents/runs?campaignId=${campaign.id}`, { cache: "no-store" });
    const runsJson = (await runsRes.json().catch(() => ({}))) as { runs?: Array<{ id: string }> };
    const taskEntries = await Promise.all((runsJson.runs ?? []).slice(0, 6).map(async (run) => {
      const runRes = await fetch(`/api/shopreel/agents/runs/${run.id}`, { cache: "no-store" });
      const runJson = (await runRes.json().catch(() => ({}))) as { tasks?: ApprovalTask[] };
      return [run.id, runJson.tasks ?? []] as const;
    }));
    setRunTasks(Object.fromEntries(taskEntries));
  })(); }, [campaign.id]);

  const approvedItem = items.find((item) => item.status === "approved" || (((item.metadata as any) ?? {}).production_package_status === "approved")) ?? null;
  const selectedItem = approvedItem ?? items[0] ?? null;
  const selectedMeta = selectedItem?.metadata && typeof selectedItem.metadata === "object" ? selectedItem.metadata as Record<string, any> : {};
  const selectedPkg = selectedItem ? (packageState[selectedItem.id]?.productionPackage ?? (selectedMeta.production_package as CampaignPackage | undefined)) : null;
  const selectedStatus = selectedItem ? (packageState[selectedItem.id]?.status ?? (typeof selectedMeta.production_package_status === "string" ? selectedMeta.production_package_status : "draft")) : "draft";

  const stage: Stage = pendingMissing.length > 0 ? "missing_info" : !approvedItem ? "choose_angle" : !selectedPkg ? "review_package" : selectedStatus !== "approved" ? "approve_package" : "copy_export";

  function applyAnswers() {
    const updates: Partial<ParsedBriefView> = {};
    const answered: string[] = [];
    for (const q of pendingMissing) {
      const val = (missingAnswers[q] ?? "").trim(); if (!val) continue;
      const k = q.toLowerCase();
      if (k.includes("business name")) updates.businessType = val;
      if (k.includes("offer")) updates.offer = val;
      if (k.includes("trust")) updates.targetCustomer = `${brief.targetCustomer ?? ""} (${val})`.trim();
      answered.push(q);
    }
    setAppliedBrief({ ...brief, ...updates, missingQuestions: pendingMissing.filter((q) => !answered.includes(q)) });
    setSessionNotice("Answers applied for this session."); setConfirmation("Answers applied.");
  }

  async function buildPackage(itemId: string, action: "build" | "approve") {
    setBusy(`${action}-${itemId}`);
    const res = await fetch(`/api/shopreel/campaigns/items/${itemId}/package`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, missingAnswers }) });
    const json = await res.json();
    if (json.ok) {
      setPackageState((p) => ({ ...p, [itemId]: json }));
      setConfirmation(action === "build" ? "Angle approved and package created." : "Package approved.");
      if (action === "build") setTimeout(() => packageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
      router.refresh();
    }
    setBusy(null);
  }

  async function copyWithFeedback(label: string, key: string, value: string) { await copyText(value); setConfirmation(`Copied ${label}.`); }
  async function refreshMediaStatus(itemId: string) {
    const mediaRes = await fetch(`/api/shopreel/campaigns/items/${itemId}/media`, { cache: "no-store" });
    const mediaJson = await mediaRes.json().catch(() => ({}));
    if (mediaJson?.ok) setMediaStateByItem((p) => ({ ...p, [itemId]: mediaJson.media }));
  }

  useEffect(() => {
    const pollIds = items.map((i) => i.id);
    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = async () => {
      for (const id of pollIds) {
        const state = mediaStateByItem[id];
        const active = isActiveMediaStatus(state?.image?.status) || isActiveMediaStatus(state?.video?.status);
        if (active) await refreshMediaStatus(id);
      }
    };
    timer = setInterval(() => { void tick(); }, 6500);
    return () => { if (timer) clearInterval(timer); };
  }, [items, mediaStateByItem]);

  async function generateMedia(itemId: string, action: "generate_image" | "generate_video", imagePurpose?: CampaignImagePurpose) {
    setMediaBusy(`${action}-${itemId}`);
    const res = await fetch(`/api/shopreel/campaigns/items/${itemId}/media`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, imagePurpose }) });
    const json = await res.json();
    if (json.ok) {
      setConfirmation(json.message ?? "Media generation started.");
      await refreshMediaStatus(itemId);
      router.refresh();
    } else setConfirmation(json.error ?? "Failed to start generation.");
    setMediaBusy(null);
  }



  function getDefaultImagePurpose(item: CampaignItemRow, meta: Record<string, any>, mediaPurpose: CampaignImagePurpose | null): CampaignImagePurpose {
    if (mediaPurpose) return mediaPurpose;
    const goal = campaign.campaign_goal ?? "";
    const mode = String(meta?.source_mode ?? "");
    if (goal === "business_advertising" || goal === "internal_self_marketing") return "static_ad";
    if (mode === "uploaded_asset") return mediaPurpose ?? "static_ad";
    return (meta.production_package ? "static_ad" : "video_reference");
  }

  return <section className="space-y-5 rounded-[2rem] border border-cyan-200/20 bg-slate-950/95 p-4 lg:p-6">
    <div className="rounded-2xl border border-cyan-300/35 bg-cyan-500/10 p-3">
      <p className="text-xs uppercase tracking-[0.18em]">Guided stages</p>
      <p className="text-sm text-white/80">Brief → Missing Info → Choose Angle → Build Package → Approve Package → Export / Generate</p>
      <p className="mt-1 text-sm">Current: <span className="font-semibold">{stage.replace("_", " ")}</span></p>
    </div>

    <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-3 text-sm">
      <p className="text-xs uppercase tracking-[0.18em]">Business ad readiness</p>
      <p>Service: {brief.serviceCategory ?? brief.businessType ?? "missing"}</p><p>Location: {brief.location ?? "missing"}</p><p>Target customer: {brief.targetCustomer ?? "missing"}</p><p>Offer: {brief.offer ?? "missing"}</p><p>Booking CTA: {brief.bookingAction ?? "missing"}</p>
      <p>Missing info: {(brief.missingQuestions ?? []).join(" | ") || "none"}</p>{sessionNotice ? <p className="text-emerald-200 mt-1">{sessionNotice}</p> : null}
    </div>

    {pendingMissing.length > 0 ? <div className="rounded-2xl border border-yellow-300/30 bg-yellow-500/10 p-3"><p className="font-semibold">Answer missing info</p>
      {pendingMissing.map((q) => <label className="mt-2 block" key={q}><span className="text-sm">{q}</span><input value={missingAnswers[q] ?? ""} onChange={(e) => setMissingAnswers((p) => ({ ...p, [q]: e.target.value }))} placeholder={questionHints[q.toLowerCase()] ?? "Add answer"} className="mt-1 w-full rounded border border-white/20 bg-black/30 p-2 text-sm" /></label>)}
      <GlassButton className="mt-3" onClick={applyAnswers}>Apply answers to campaign</GlassButton></div> : null}

    <div className="rounded-2xl border border-cyan-300/35 bg-cyan-500/10 p-4">
      <div className="mb-2 text-sm">Primary next action: <span className="font-semibold">{stage === "missing_info" ? "Answer missing info" : stage === "choose_angle" ? "Approve one campaign angle" : stage === "review_package" ? "Review the production package" : stage === "approve_package" ? "Approve the package" : "Copy the finished package"}</span></div>
      {confirmation ? <p className="text-emerald-300 text-xs">What just happened? {confirmation}</p> : null}
    </div>

    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4"><p className="mb-2 text-xs uppercase tracking-[0.18em]">Campaign angles and package</p>
      {items.slice(0, 5).map((item) => {
        const meta = (item.metadata && typeof item.metadata === "object" ? item.metadata : {}) as Record<string, any>;
        const intel = (meta.campaign_intelligence && typeof meta.campaign_intelligence === "object" ? meta.campaign_intelligence : {}) as Record<string, any>;
        const pkg = packageState[item.id]?.productionPackage ?? (meta.production_package as CampaignPackage | undefined);
        const pkgStatus = packageState[item.id]?.status ?? (typeof meta.production_package_status === "string" ? meta.production_package_status : "draft");
        const media = readMediaMetadata(item.metadata);
        const selectedPurpose = imagePurposeByItem[item.id] ?? getDefaultImagePurpose(item, meta, media.imagePurpose);
        const liveMedia = mediaStateByItem[item.id];
        const imageStatus = normalizeMediaStatus(liveMedia?.image?.status ?? media.imageStatus);
        const videoStatus = normalizeMediaStatus(liveMedia?.video?.status ?? media.videoStatus);
        const imagePreview = liveMedia?.image?.previewUrl ?? media.imagePreviewUrl;
        const imageJobId = liveMedia?.image?.jobId ?? media.imageJobId;
        const videoJobId = liveMedia?.video?.jobId ?? media.videoJobId;
        const imageActive = isActiveMediaStatus(imageStatus);
        const imageHasOutput = Boolean(imagePreview || (liveMedia?.image?.outputAssetId ?? media.imageAssetId));
        const imageCompleted = imageStatus === "completed" && imageHasOutput;
        const imageFailed = imageStatus === "failed";
        const videoEnabled = pkgStatus === "approved" && imageCompleted;
        const imageEnabled = pkgStatus === "approved" && !imageActive;
        const helperText = !videoEnabled ? (imageFailed ? "Retry image generation before creating video." : imageActive ? "Video unlocks after image generation finishes." : "Generate an image first. Video unlocks after image generation finishes.") : "Video will use this image as the starting frame.";
        return <div key={item.id} className="rounded-xl border border-white/10 bg-slate-950 p-3 mb-3"><div className="flex justify-between gap-3 flex-wrap"><div><div className="font-semibold">{item.title}</div><div className="text-sm text-white/70">{intel.hook ?? item.angle}</div></div><div>{item.status !== "approved" ? <GlassButton variant="secondary" disabled={busy === `build-${item.id}`} onClick={() => void buildPackage(item.id, "build")}>Approve this angle</GlassButton> : null}{pkg && pkgStatus !== "approved" ? <GlassButton className="ml-2" variant="secondary" disabled={busy === `approve-${item.id}`} onClick={() => void buildPackage(item.id, "approve")}>Approve package</GlassButton> : null}</div></div>
          {pkg ? <div ref={selectedItem?.id === item.id ? packageRef : undefined} className="mt-3 rounded-lg border border-cyan-200/20 p-3"><p className="font-semibold">Review production package</p><p className="text-xs text-cyan-100/80 mb-2">Copy buttons place the text on your clipboard so you can paste it into Facebook, Instagram, notes, or your scheduler.</p>
            <div className="grid gap-2 md:grid-cols-2">{pkgCards.map(([k, label, helper]) => { const value = pkg.sections?.[k] ?? pkg.sections?.[k.replace("cta_options", "CTA_options")]; if (!value) return null; return <div key={k} className="rounded border border-white/10 p-2"><p className="font-medium">{label}</p><p className="text-xs text-white/60">{helper}</p><pre className="text-xs whitespace-pre-wrap">{normalize(value as string | string[])}</pre><GlassButton variant="ghost" onClick={() => void copyWithFeedback(label, `${item.id}-${k}`, normalize(value as string | string[]))}>Copy this section</GlassButton></div>; })}</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3"><GlassButton variant="ghost" onClick={() => void copyWithFeedback("everything for posting", `${item.id}-all`, JSON.stringify(pkg.sections ?? {}, null, 2))}>Copy everything for posting</GlassButton><GlassButton variant="ghost" onClick={() => void copyWithFeedback("Facebook post", `${item.id}-post`, String(pkg.sections?.facebook_post ?? pkg.sections?.caption ?? ""))}>Copy Facebook post</GlassButton><GlassButton variant="ghost" onClick={() => void copyWithFeedback("reel script", `${item.id}-script`, String(pkg.sections?.short_reel_script ?? pkg.sections?.short_script ?? ""))}>Copy reel script</GlassButton></div>
            <div className="mt-3 rounded border border-white/10 p-3">
              <p className="font-medium">Generate media</p>
              <p className="text-xs text-white/70">{helperText}</p>
              <div className="mt-2 rounded border border-white/10 p-3">
                <p className="text-sm font-semibold">Choose your image type</p>
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  {[{key:"static_ad",title:"Static ad image",helper:"Best for Facebook posts, boosted ads, flyers, and Instagram posts. Recommended first."},{key:"video_reference",title:"Video reference image",helper:"Best if you want to turn this campaign into a short reel/video."},{key:"uploaded_reference",title:"Upload my own reference",helper:"Use a real shop, product, vehicle, before/after, storefront, or team photo."}].map((opt:any)=><button key={opt.key} type="button" disabled={opt.key==="uploaded_reference"} onClick={()=>setImagePurposeByItem((p)=>({...p,[item.id]:opt.key as CampaignImagePurpose}))} className={`rounded border p-2 text-left ${selectedPurpose===opt.key?"border-cyan-300 bg-cyan-500/20":"border-white/10"} ${opt.key==="uploaded_reference"?"opacity-60 cursor-not-allowed":""}`}><p className="text-sm font-medium">{opt.title}</p><p className="text-xs text-white/70">{opt.helper}</p>{opt.key==="uploaded_reference"?<p className="text-xs text-yellow-300 mt-1">Coming next: connect uploaded image to this campaign.</p>:null}</button>)}
                </div>
                <div className="mt-2"><Link className="text-xs text-cyan-300" href="/shopreel/upload">Upload reference image</Link><p className="text-xs text-white/60">Upload support will be connected to this campaign item next.</p></div>
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                <GlassButton variant="ghost" disabled={!imageEnabled || selectedPurpose === "uploaded_reference" || mediaBusy === `generate_image-${item.id}`} onClick={() => void generateMedia(item.id, "generate_image", selectedPurpose)}>{imageActive ? "Image generation queued" : imageCompleted ? "Regenerate image" : "Generate image"}</GlassButton>
                <GlassButton variant="ghost" disabled={!videoEnabled || mediaBusy === `generate_video-${item.id}`} onClick={() => void generateMedia(item.id, "generate_video", selectedPurpose)}>Generate video</GlassButton>
                {imageJobId ? <Link href={`/shopreel/video-creation/jobs/${imageJobId}`}><GlassButton variant="ghost">Open image job</GlassButton></Link> : null}
                {videoJobId ? <Link href={`/shopreel/video-creation/jobs/${videoJobId}`}><GlassButton variant="ghost">Open video job</GlassButton></Link> : null}
              </div>
              {imagePreview ? <div className="mt-2 space-y-2"><img src={imagePreview} alt={`${item.title} generated image`} className="h-40 w-auto max-w-full rounded border border-white/10 object-cover" /><a className="text-xs text-cyan-300 block" href={imagePreview} target="_blank" rel="noreferrer">Open generated image preview</a></div> : null}
              {(liveMedia?.video?.previewUrl || media.videoPreviewUrl) ? <a className="text-xs text-cyan-300 mt-1 block" href={liveMedia?.video?.previewUrl ?? media.videoPreviewUrl ?? "#"} target="_blank">Open generated video preview</a> : null}
              {(media.imagePurpose ?? selectedPurpose) ? <p className="text-xs mt-1">Image purpose: {String(media.imagePurpose ?? selectedPurpose).replaceAll("_"," ")}</p> : null}
              {imageStatus ? <p className="text-xs mt-1">Image job status: {imageStatus}</p> : null}
              {imageCompleted ? <p className="text-xs mt-1 text-emerald-300">Use this image to generate video.</p> : null}
              {imageStatus === "completed" && !imageHasOutput ? <p className="text-xs mt-1 text-yellow-300">Image job completed but no preview URL is available.</p> : null}
              {videoStatus ? <p className="text-xs mt-1">Video job status: {videoStatus}</p> : null}
            </div>
            {pkgStatus === "approved" ? <p className="mt-2 text-emerald-300 text-sm">Package approved. You can now copy/export or generate media.</p> : null}
          </div> : null}
          <div className="mt-2"><Link href={`/shopreel/campaigns/items/${item.id}?from=workspace`}><GlassButton variant="ghost">Open output</GlassButton></Link></div>
        </div>;
      })}
    </div>

    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4"><p className="mb-2 text-xs uppercase tracking-[0.18em]">Approval tasks</p><p className="text-sm text-white/70">{Object.values(runTasks).flat().filter((t) => t.status === "proposed" && t.requires_approval).length} tasks awaiting review.</p></div>
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4"><p className="mb-2 text-xs uppercase tracking-[0.18em]">Campaign guidance</p>{adaptiveMemory.learnedNotices.map((n) => <p key={n} className="text-sm">{n}</p>)}</div>
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4"><p className="mb-2 text-xs uppercase tracking-[0.18em]">Campaign memory</p><p className="text-sm text-white/70">Use review and production panels to continue memory updates.</p></div>
  </section>;
}
