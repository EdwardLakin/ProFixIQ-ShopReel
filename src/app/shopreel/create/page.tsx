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
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

type CreatorMode =
  | "research_script"
  | "angle_pack"
  | "debunk"
  | "stitch";

type OutputType = "video" | "blog" | "email" | "post";

type Angle = {
  title: string;
  angle: string;
  hook: string;
  whyItWorks: string;
  suggestedCta: string;
};

type CreateResponse =
  | {
      ok: true;
      mode: CreatorMode;
      outputType: OutputType;
      generationId?: string;
      editorUrl?: string;
      expandedTopic?: string;
      researchSummary?: string;
      researchBullets?: string[];
      angles?: Angle[];
    }
  | {
      ok?: false;
      error?: string;
    };

const MODE_OPTIONS: Array<{ value: CreatorMode; label: string }> = [
  { value: "research_script", label: "Research + script" },
  { value: "angle_pack", label: "Angle pack" },
  { value: "debunk", label: "Debunk" },
  { value: "stitch", label: "Stitch" },
];

const OUTPUT_OPTIONS: Array<{ value: OutputType; label: string }> = [
  { value: "video", label: "Video" },
  { value: "blog", label: "Blog" },
  { value: "email", label: "Email" },
  { value: "post", label: "Social post" },
];

export default function ShopReelCreatePage() {
  const router = useRouter();
  const [mode, setMode] = useState<CreatorMode>("research_script");
  const [outputType, setOutputType] = useState<OutputType>("video");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [platformFocus, setPlatformFocus] = useState<
    "instagram" | "tiktok" | "youtube" | "facebook" | "multi"
  >("multi");
  const [tone, setTone] = useState<
    "professional" | "educational" | "friendly" | "direct" | "confident" | "high-energy"
  >("confident");
  const [sourceText, setSourceText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<{
    expandedTopic: string;
    summary: string;
    bullets: string[];
    angles: Angle[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createFromTopic() {
    try {
      setError(null);
      setIsSubmitting(true);
      setPreview(null);

      const res = await fetch("/api/shopreel/create/research-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          outputType,
          topic,
          audience,
          platformFocus,
          tone,
          sourceText: sourceText.trim() || undefined,
          sourceUrl: sourceUrl.trim() || undefined,
        }),
      });

      const json = (await res.json()) as CreateResponse;

      if (!res.ok || !json.ok) {
        throw new Error(("error" in json && json.error) || "Failed to create story");
      }

      setPreview({
        expandedTopic: json.expandedTopic ?? topic,
        summary: json.researchSummary ?? "",
        bullets: json.researchBullets ?? [],
        angles: json.angles ?? [],
      });

      if (json.mode !== "angle_pack" && json.editorUrl) {
        router.push(json.editorUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create story");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Creator Mode"
      subtitle="Start from a topic, angle pack, debunk, or stitch prompt. ShopReel expands the topic, builds creator angles, and writes the script."
      actions={<GlassBadge tone="copper">Creator research + script</GlassBadge>}
    >
      <ShopReelNav />

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassCard
          label="Start From Topic"
          title="Topic -> Research -> Angles -> Output"
          description="Create video, blog, email, or social post outputs from one creator prompt."
          strong
          footer={
            <div className="flex flex-wrap gap-3">
              <GlassButton
                variant="primary"
                onClick={() => void createFromTopic()}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Building..."
                  : mode === "angle_pack"
                    ? "Build angle pack"
                    : `Build ${outputType}`}
              </GlassButton>
            </div>
          }
        >
          <label className="space-y-2">
            <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
              Creator mode
            </div>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as CreatorMode)}
              className={cx(
                "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
                glassTheme.text.primary,
                glassTheme.glass.input,
                glassTheme.border.softer,
                "bg-transparent",
              )}
            >
              {MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
              Output type
            </div>
            <select
              value={outputType}
              onChange={(e) => setOutputType(e.target.value as OutputType)}
              className={cx(
                "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
                glassTheme.text.primary,
                glassTheme.glass.input,
                glassTheme.border.softer,
                "bg-transparent",
              )}
            >
              {OUTPUT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <GlassTextarea
            label="Topic or prompt"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Example: iPhone 18 leaks and rumors"
          />

          <GlassInput
            label="Audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Example: Apple fans, tech buyers, creators"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                Platform focus
              </div>
              <select
                value={platformFocus}
                onChange={(e) => setPlatformFocus(e.target.value as typeof platformFocus)}
                className={cx(
                  "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
                  glassTheme.text.primary,
                  glassTheme.glass.input,
                  glassTheme.border.softer,
                  "bg-transparent",
                )}
              >
                <option value="multi">Multi-platform</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube Shorts</option>
                <option value="facebook">Facebook</option>
              </select>
            </label>

            <label className="space-y-2">
              <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                Tone
              </div>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as typeof tone)}
                className={cx(
                  "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
                  glassTheme.text.primary,
                  glassTheme.glass.input,
                  glassTheme.border.softer,
                  "bg-transparent",
                )}
              >
                <option value="confident">Confident</option>
                <option value="professional">Professional</option>
                <option value="educational">Educational</option>
                <option value="friendly">Friendly</option>
                <option value="direct">Direct</option>
                <option value="high-energy">High-energy</option>
              </select>
            </label>
          </div>

          <GlassTextarea
            label="Source text for debunk or stitch"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Paste the claim, caption, transcript, or creator take here"
          />

          <GlassInput
            label="Source URL"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="Optional source link"
          />

          {error ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.copper,
                glassTheme.glass.panelSoft,
                glassTheme.text.copperSoft,
              )}
            >
              {error}
            </div>
          ) : null}
        </GlassCard>

        <GlassCard
          label="Creator intelligence"
          title="Expanded topic and angle pack"
          description="Use this to turn one narrow prompt into multiple creator opportunities."
          strong
        >
          {preview ? (
            <div className="space-y-4">
              <div
                className={cx(
                  "rounded-2xl border p-4",
                  glassTheme.border.copper,
                  glassTheme.glass.panelSoft,
                )}
              >
                <div className={cx("text-sm", glassTheme.text.secondary)}>Expanded topic</div>
                <div className={cx("mt-1 text-base font-medium", glassTheme.text.primary)}>
                  {preview.expandedTopic}
                </div>
              </div>

              <div
                className={cx(
                  "rounded-2xl border p-4",
                  glassTheme.border.copper,
                  glassTheme.glass.panelSoft,
                )}
              >
                <div className={cx("text-sm", glassTheme.text.secondary)}>Research summary</div>
                <div className={cx("mt-1 text-base font-medium", glassTheme.text.primary)}>
                  {preview.summary}
                </div>
              </div>

              <div className="grid gap-3">
                {preview.bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className={cx(
                      "rounded-2xl border p-4 text-sm",
                      glassTheme.border.softer,
                      glassTheme.glass.panelSoft,
                      glassTheme.text.primary,
                    )}
                  >
                    {bullet}
                  </div>
                ))}
              </div>

              <div className="grid gap-3">
                {preview.angles.map((angle, index) => (
                  <div
                    key={`${angle.title}-${index}`}
                    className={cx(
                      "rounded-2xl border p-4",
                      glassTheme.border.copper,
                      glassTheme.glass.panelSoft,
                    )}
                  >
                    <div className={cx("text-base font-semibold", glassTheme.text.primary)}>
                      {angle.title}
                    </div>
                    <div className={cx("mt-2 text-sm", glassTheme.text.secondary)}>
                      {angle.angle}
                    </div>
                    <div className={cx("mt-3 text-sm", glassTheme.text.primary)}>
                      Hook: {angle.hook}
                    </div>
                    <div className={cx("mt-2 text-sm", glassTheme.text.secondary)}>
                      Why it works: {angle.whyItWorks}
                    </div>
                    <div className={cx("mt-2 text-sm", glassTheme.text.secondary)}>
                      CTA: {angle.suggestedCta}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {[
                "Research script for the main post",
                "Angle pack for multiple follow-up posts",
                "Debunk mode for wild social claims",
                "Stitch mode for creator responses",
              ].map((item) => (
                <div
                  key={item}
                  className={cx(
                    "rounded-2xl border p-4 text-sm",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                    glassTheme.text.primary,
                  )}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </section>
    </GlassShell>
  );
}
