
"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import Link from "next/link";

import GlassButton from "@/features/shopreel/ui/system/GlassButton";

import GlassCard from "@/features/shopreel/ui/system/GlassCard";

import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";

import { SHOPREEL_PLATFORM_PRESETS } from "@/features/shopreel/platforms/presets";

import type { ShopReelReviewDraft } from "@/features/shopreel/review/reviewDraft";

type Props = { draft: ShopReelReviewDraft };

function buildPlatformCopy(output: ShopReelReviewDraft["platformOutputs"][number]) {

  return [

    output.hook,

    output.body,

    output.cta,

    output.caption,

    output.hashtags.join(" "),

  ]

    .filter((value) => value.trim().length > 0)

    .join("\n\n");

}

function buildVideoCreatePrompt(draft: ShopReelReviewDraft): string {
  const outputs = draft.platformOutputs
    .map((output) => {
      return [
        `${output.platformLabel}:`,
        `Hook: ${output.hook}`,
        `Body: ${output.body}`,
        `CTA: ${output.cta}`,
        output.hashtags.length > 0 ? `Hashtags: ${output.hashtags.join(" ")}` : "",
      ].filter(Boolean).join("\n");
    })
    .join("\n\n");

  return [
    "Create a short-form video/reel from this approved ShopReel concept.",
    "",
    draft.campaignAngle ? `Campaign angle: ${draft.campaignAngle}` : "",
    draft.audience ? `Audience: ${draft.audience}` : "",
    "",
    "Use this platform copy as the source truth:",
    outputs,
    "",
    draft.manualAssetFiles.length > 0
      ? `Use the uploaded media references: ${draft.manualAssetFiles.join(", ")}`
      : "No media is attached yet. Build the video concept first and prompt me to upload source media if needed.",
    "",
    "Make the video hook-first, clear, useful, and ready for Instagram/Facebook short-form packaging.",
  ].filter(Boolean).join("\n");
}

function saveReviewCreatePrefill(draft: ShopReelReviewDraft) {
  const prompt = buildVideoCreatePrompt(draft);

  window.localStorage.setItem(
    "shopreel:createPrefill",
    JSON.stringify({
      prompt,
      contentType: "Short-form video",
      source: "review",
      createdAt: Date.now(),
    }),
  );

  return prompt;
}

export default function ReviewWorkspaceClient({ draft }: Props) {

  const [conceptTitle, setConceptTitle] = useState(draft.conceptTitle ?? "");

  const [hook, setHook] = useState(draft.hook ?? "");

  const [script, setScript] = useState(draft.script ?? "");

  const [voiceover, setVoiceover] = useState(draft.voiceover ?? "");

  const [captionText, setCaptionText] = useState(draft.captionText ?? "");

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  const [startingRender, setStartingRender] = useState(false);

  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [refining, setRefining] = useState(false);

  const router = useRouter();

  const platformLabels = draft.platforms.map((id) => {

    const preset = SHOPREEL_PLATFORM_PRESETS.find((item) => item.id === id);

    return preset?.label ?? id;

  });

  const fullPackageText = useMemo(() => {

    const lines = [

      "# ShopReel Social Package",

      "",

      `Generation ID: ${draft.generationId}`,

      draft.campaignAngle ? `Campaign angle: ${draft.campaignAngle}` : null,

      draft.primaryCta ? `Primary CTA: ${draft.primaryCta}` : null,

      draft.audience ? `Audience: ${draft.audience}` : "Audience: not provided",

      "",

      "## Source prompt",

      draft.prompt || "Not provided.",

      "",

      "## Source media",

      ...(draft.manualAssetFiles.length > 0

        ? draft.manualAssetFiles.map((file) => `- ${file}`)

        : ["- No media files attached."]),

      "",

      "## Platform copy",

    ].filter((line): line is string => typeof line === "string");

    for (const output of draft.platformOutputs) {

      lines.push("");

      lines.push(`### ${output.platformLabel}`);

      lines.push(`Intent: ${output.intentLabel}`);

      lines.push("");

      lines.push(`Hook: ${output.hook || "—"}`);

      lines.push("");

      lines.push(output.body || "—");

      lines.push("");

      lines.push(`CTA: ${output.cta || "—"}`);

      lines.push("");

      lines.push("Caption:");

      lines.push(output.caption || "—");

      lines.push("");

      lines.push(`Hashtags: ${output.hashtags.join(" ") || "—"}`);

    }

    if (draft.alternateHooks.length > 0) {

      lines.push("");

      lines.push("## Alternate hooks");

      lines.push(...draft.alternateHooks.slice(0, 5).map((item) => `- ${item}`));

    }

    lines.push("");

    lines.push("## Manual posting checklist");

    lines.push("- Pick the platform copy.");

    lines.push("- Attach the uploaded media.");

    lines.push("- Confirm CTA and hashtags.");

    lines.push("- Post manually to the selected channel.");

    return lines.join("\n");

  }, [draft]);

  async function saveDraft() {

    setSaving(true);

    setMessage(null);

    try {

      const res = await fetch(`/api/shopreel/generations/${draft.generationId}/draft`, {

        method: "POST",

        headers: { "content-type": "application/json" },

        body: JSON.stringify({

          storyDraft: {

            title: conceptTitle,

            hook,

            scriptText: script,

            voiceoverText: voiceover,

            caption: captionText,

          },

        }),

      });

      if (!res.ok) throw new Error("Failed to save draft edits");

      setMessage("Draft saved.");

    } catch {

      setMessage("Unable to save right now. Please try again.");

    } finally {

      setSaving(false);

    }

  }

  async function refineDraft() {
    const instruction = refineInstruction.trim();
    if (!instruction) {
      setMessage("Tell ShopReel what to change first.");
      return;
    }

    setRefining(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/shopreel/generations/${draft.generationId}/refine`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instruction }),
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to refine draft");

      setMessage("Draft refined. Reloading updated output…");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to refine right now.");
    } finally {
      setRefining(false);
    }
  }

  async function startRender() {

    setStartingRender(true);

    setMessage(null);

    try {

      const res = await fetch(`/api/shopreel/generations/${draft.generationId}/render`, { method: "POST" });

      const json = (await res.json()) as { ok?: boolean; error?: string; renderJobsUrl?: string };

      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to start render");

      router.push(json.renderJobsUrl ?? "/shopreel/render-jobs");

    } catch (error) {

      setMessage(error instanceof Error ? error.message : "Unable to start render right now.");

    } finally {

      setStartingRender(false);

    }

  }

  async function copyText(value: string, label: string) {

    try {

      await navigator.clipboard.writeText(value);

      setCopyMessage(`${label} copied.`);

    } catch {

      setCopyMessage(`Unable to copy ${label.toLowerCase()}.`);

    }

  }

  function downloadPackage() {

    const blob = new Blob([fullPackageText], { type: "text/markdown;charset=utf-8" });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;

    anchor.download = `shopreel-social-package-${draft.generationId.slice(0, 8)}.md`;

    anchor.click();

    URL.revokeObjectURL(url);

    setCopyMessage("Markdown package downloaded.");

  }

  const hasPlatformOutputs = draft.platformOutputs.some(

    (output) => output.hook || output.body || output.caption || output.cta || output.hashtags.length > 0,

  );

  return (

    <div className="space-y-5">

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_360px]">

        <GlassCard label="Campaign brief" title="Ready-to-use social package" strong>

          <div className="space-y-4">

            {draft.campaignAngle ? (

              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.06] p-4">

                <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Campaign angle</div>

                <p className="mt-2 text-base leading-7 text-white">{draft.campaignAngle}</p>

              </div>

            ) : null}

            <div className="grid gap-3 md:grid-cols-3">

              <div className="rounded-2xl border border-white/10 bg-black/25 p-3">

                <div className="text-xs uppercase tracking-[0.16em] text-white/45">Platforms</div>

                <div className="mt-2 flex flex-wrap gap-2">

                  {platformLabels.map((label) => (

                    <GlassBadge key={label} tone="muted">{label}</GlassBadge>

                  ))}

                </div>

              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-3">

                <div className="text-xs uppercase tracking-[0.16em] text-white/45">Source media</div>

                <p className="mt-2 text-sm text-white/85">{draft.manualAssetFiles.length} file{draft.manualAssetFiles.length === 1 ? "" : "s"}</p>

              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-3">

                <div className="text-xs uppercase tracking-[0.16em] text-white/45">CTA goal</div>

                <p className="mt-2 text-sm text-white/85">{draft.primaryCta || "Manual posting handoff"}</p>

              </div>

            </div>

            <div>

              <div className="text-xs uppercase tracking-[0.18em] text-white/45">Original prompt</div>

              <p className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/25 p-3 text-sm leading-6 text-white/75">

                {draft.prompt || "—"}

              </p>

            </div>

          </div>

        </GlassCard>

        <GlassCard label="Actions" title="Copy or download">

          <div className="space-y-3 text-sm text-white/80">

            <p>Use this package for manual Facebook/Instagram posting. Rendering remains optional for video workflows.</p>

            <div className="grid gap-2">

              <GlassButton onClick={() => copyText(fullPackageText, "Full package")}>Copy all</GlassButton>

              <GlassButton onClick={downloadPackage}>Download package (.md)</GlassButton>
              <Link
                href={`/shopreel/create?source=review&contentType=Short-form+video&prompt=${encodeURIComponent(buildVideoCreatePrompt(draft))}`}
                onClick={() => saveReviewCreatePrefill(draft)}
              >
                <GlassButton variant="ghost">Create reel/video from this</GlassButton>
              </Link>

              <GlassButton variant="ghost" onClick={() => copyText(draft.captionText ?? "", "Primary caption")}>Copy primary caption</GlassButton>

            </div>

            <div className="grid gap-2 pt-2">

              <GlassButton variant="ghost" onClick={startRender} disabled={startingRender}>

                {startingRender ? "Starting render…" : "Start render (optional)"}

              </GlassButton>

              <Link href="/shopreel/generations"><GlassButton variant="ghost">Back to Projects</GlassButton></Link>

              <Link href={`/shopreel/generations/${draft.generationId}`}><GlassButton variant="ghost">Open generation detail</GlassButton></Link>

            </div>

            {copyMessage ? <p className="text-xs text-cyan-100">{copyMessage}</p> : null}

            {message ? <p className="text-xs text-white/70">{message}</p> : null}

          </div>

        </GlassCard>

      </div>

      
      <GlassCard label="AI refinement" title="Refine this output" description="Ask ShopReel for plain-language changes without uploading again.">
        <div className="space-y-3">
          <textarea
            value={refineInstruction}
            onChange={(event) => setRefineInstruction(event.target.value)}
            placeholder="Example: Make Instagram punchier, make Facebook less salesy, and give me a stronger CTA."
            className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-cyan-300/40"
          />
          <div className="flex flex-wrap gap-2">
            {[
              "Make it less salesy",
              "Make Instagram punchier",
              "Make Facebook more professional",
              "Give me 3 stronger hooks",
              "Make it founder-led",
            ].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRefineInstruction(item)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75 transition hover:bg-white/[0.08]"
              >
                {item}
              </button>
            ))}
          </div>
          <GlassButton onClick={refineDraft} disabled={refining}>
            {refining ? "Refining…" : "Refine output"}
          </GlassButton>
        </div>
      </GlassCard>

<GlassCard label="Platform outputs" title="Facebook + Instagram delivery copy" strong>

        {!hasPlatformOutputs ? (

          <div className="rounded-2xl border border-amber-300/20 bg-amber-400/[0.06] p-4 text-sm text-amber-50">

            Platform-specific outputs were not generated for this draft. Use the advanced draft fields below, or create a new draft for platform-ready copy.

          </div>

        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">

          {draft.platformOutputs.map((output) => (

            <article key={output.platformId} className="rounded-3xl border border-white/12 bg-white/[0.035] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">

              <div className="mb-4 flex items-start justify-between gap-3">

                <div>

                  <div className="text-lg font-semibold text-white">{output.platformLabel}</div>

                  <div className="mt-1 text-xs uppercase tracking-[0.16em] text-cyan-100/55">{output.intentLabel}</div>

                </div>

                <div className="flex flex-wrap justify-end gap-2">

                  <GlassButton variant="ghost" onClick={() => copyText(buildPlatformCopy(output), `${output.platformLabel} package`)}>

                    Copy package

                  </GlassButton>

                  <GlassButton variant="ghost" onClick={() => copyText(output.caption || buildPlatformCopy(output), `${output.platformLabel} caption`)}>

                    Copy caption

                  </GlassButton>

                </div>

              </div>

              <div className="space-y-4">

                <section className="rounded-2xl border border-violet-300/20 bg-violet-400/[0.07] p-4">

                  <div className="text-xs uppercase tracking-[0.18em] text-violet-100/60">Hook</div>

                  <p className="mt-2 text-xl font-semibold leading-7 text-white">{output.hook || "—"}</p>

                </section>

                <section>

                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Body</div>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/85">{output.body || "—"}</p>

                </section>

                <section className="rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.05] p-3">

                  <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/60">CTA</div>

                  <p className="mt-1 text-sm font-semibold text-white">{output.cta || "—"}</p>

                </section>

                <section>

                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Caption</div>

                  <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/25 p-3 text-sm leading-6 text-white/85">

                    {output.caption || "—"}

                  </p>

                </section>

                <section>

                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Hashtags</div>

                  <div className="mt-2 flex flex-wrap gap-2">

                    {output.hashtags.length > 0 ? (

                      output.hashtags.map((tag) => (

                        <span key={tag} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/80">

                          {tag}

                        </span>

                      ))

                    ) : (

                      <span className="text-sm text-white/45">No hashtags provided.</span>

                    )}

                  </div>

                </section>

              </div>

            </article>

          ))}

        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">

          {draft.alternateHooks.length > 0 ? (

            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">

              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">Alternate hooks</div>

              <div className="space-y-2">

                {draft.alternateHooks.slice(0, 3).map((item) => (

                  <button

                    key={item}

                    type="button"

                    onClick={() => copyText(item, "Alternate hook")}

                    className="block w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/[0.08]"

                  >

                    {item}

                  </button>

                ))}

              </div>

            </div>

          ) : null}

          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">

            <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">Source media</div>

            <div className="flex flex-wrap gap-2">

              {draft.manualAssetFiles.length > 0 ? (

                draft.manualAssetFiles.map((file) => (

                  <span key={file} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/75">

                    {file}

                  </span>

                ))

              ) : (

                <span className="text-sm text-white/45">No filenames captured.</span>

              )}

            </div>

          </div>

        </div>

      </GlassCard>

      <GlassCard label="Advanced edit" title="Optional draft fields" strong>

        <p className="mb-4 text-sm text-white/60">

          These fields support video/reel workflows and older drafts. For manual social posts, use the platform cards above as the primary output.

        </p>

        <div className="grid gap-3 md:grid-cols-2">

          <label className="space-y-1 md:col-span-2">

            <span className="text-xs uppercase text-white/55">Concept title</span>

            <input className="w-full rounded-xl border border-white/20 bg-white/5 p-2" value={conceptTitle} onChange={(event) => setConceptTitle(event.target.value)} />

          </label>

          <label className="space-y-1 md:col-span-2">

            <span className="text-xs uppercase text-white/55">Hook</span>

            <textarea className="w-full rounded-xl border border-white/20 bg-white/5 p-2" rows={2} value={hook} onChange={(event) => setHook(event.target.value)} />

          </label>

          <label className="space-y-1">

            <span className="text-xs uppercase text-white/55">Script</span>

            <textarea className="w-full rounded-xl border border-white/20 bg-white/5 p-2" rows={6} value={script} onChange={(event) => setScript(event.target.value)} />

          </label>

          <label className="space-y-1">

            <span className="text-xs uppercase text-white/55">Voiceover</span>

            <textarea className="w-full rounded-xl border border-white/20 bg-white/5 p-2" rows={6} value={voiceover} onChange={(event) => setVoiceover(event.target.value)} />

          </label>

          <label className="space-y-1 md:col-span-2">

            <span className="text-xs uppercase text-white/55">Caption</span>

            <textarea className="w-full rounded-xl border border-white/20 bg-white/5 p-2" rows={3} value={captionText} onChange={(event) => setCaptionText(event.target.value)} />

          </label>

        </div>

        <div className="mt-4 flex items-center gap-3">

          <GlassButton onClick={saveDraft} disabled={saving}>{saving ? "Saving…" : "Save draft updates"}</GlassButton>

          {message ? <span className="text-sm text-white/70">{message}</span> : null}

        </div>

      </GlassCard>

    </div>

  );

}

