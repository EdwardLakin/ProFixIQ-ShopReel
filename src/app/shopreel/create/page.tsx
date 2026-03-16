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
import type {
  BlogLengthMode,
  BlogStyle,
  OutputType,
} from "@/features/shopreel/creator/buildCreatorOutputs";

type CreatorMode =
  | "research_script"
  | "angle_pack"
  | "debunk"
  | "stitch";

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
      creatorRequestId?: string;
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
  { value: "vlog", label: "Vlog" },
  { value: "blog", label: "Blog" },
  { value: "email", label: "Email" },
  { value: "post", label: "Social post" },
];

const BLOG_STYLE_OPTIONS: Array<{ value: BlogStyle; label: string }> = [
  { value: "auto", label: "Auto rotate" },
  { value: "story_driven", label: "Story-driven" },
  { value: "educational", label: "Educational" },
  { value: "opinion", label: "Opinion piece" },
  { value: "case_study", label: "Case study" },
  { value: "problem_solution", label: "Problem → Solution" },
];

const BLOG_LENGTH_OPTIONS: Array<{ value: BlogLengthMode; label: string }> = [
  { value: "short", label: "Short" },
  { value: "standard", label: "Standard" },
  { value: "long", label: "Long form" },
];

export default function ShopReelCreatePage() {
  const router = useRouter();

  const [mode, setMode] = useState<CreatorMode>("research_script");
  const [outputType, setOutputType] = useState<OutputType>("video");
  const [blogStyle, setBlogStyle] = useState<BlogStyle>("auto");
  const [blogLengthMode, setBlogLengthMode] = useState<BlogLengthMode>("standard");
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
  const [runningAngleKey, setRunningAngleKey] = useState<string | null>(null);
  const [selectedAngleIndex, setSelectedAngleIndex] = useState<number | null>(null);
  const [preview, setPreview] = useState<{
    creatorRequestId?: string;
    expandedTopic: string;
    summary: string;
    bullets: string[];
    angles: Angle[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isBlogOutput = outputType === "blog";

  async function createFromTopic() {
    try {
      setError(null);
      setIsSubmitting(true);
      setPreview(null);
      setSelectedAngleIndex(null);

      const res = await fetch("/api/shopreel/create/research-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          outputType,
          blogStyle,
          blogLengthMode,
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
        creatorRequestId: json.creatorRequestId,
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

  async function generateFromAngle(angle: Angle, angleIndex: number, targetOutputType: OutputType) {
    try {
      setError(null);
      const key = `${angleIndex}:${targetOutputType}`;
      setRunningAngleKey(key);
      setSelectedAngleIndex(angleIndex);

      const res = await fetch("/api/shopreel/create/from-output", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatorRequestId: preview?.creatorRequestId ?? null,
          outputType: targetOutputType,
          topic: topic.trim() || preview?.expandedTopic || "Creator topic",
          audience: audience.trim() || undefined,
          platformFocus,
          tone,
          expandedTopic: preview?.expandedTopic ?? topic,
          researchSummary: preview?.summary ?? angle.angle,
          researchBullets: preview?.bullets ?? [],
          angle,
        }),
      });

      const json = (await res.json()) as CreateResponse;

      if (!res.ok || !json.ok) {
        throw new Error(("error" in json && json.error) || "Failed to create from angle");
      }

      if (json.editorUrl) {
        router.push(json.editorUrl);
        return;
      }

      throw new Error("No editor URL returned");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create from angle");
    } finally {
      setRunningAngleKey(null);
    }
  }

  function useAngle(angle: Angle, angleIndex: number) {
    setSelectedAngleIndex(angleIndex);
    setTopic(`${preview?.expandedTopic ?? topic} — ${angle.title}`);
  }

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Creator Mode"
      subtitle="Start from a topic, angle pack, debunk, or stitch prompt. ShopReel expands the topic, builds creator angles, and writes the script."
      actions={<GlassBadge tone="copper">Creator research + multi-format output</GlassBadge>}
    >
      <ShopReelNav />

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassCard
          label="Start From Topic"
          title="Topic -> Research -> Angles -> Output"
          description="Create video, vlog, blog, email, or social post outputs from one creator prompt."
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

          {isBlogOutput ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                  Blog style
                </div>
                <select
                  value={blogStyle}
                  onChange={(e) => setBlogStyle(e.target.value as BlogStyle)}
                  className={cx(
                    "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
                    glassTheme.text.primary,
                    glassTheme.glass.input,
                    glassTheme.border.softer,
                    "bg-transparent",
                  )}
                >
                  {BLOG_STYLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                  Blog length
                </div>
                <select
                  value={blogLengthMode}
                  onChange={(e) => setBlogLengthMode(e.target.value as BlogLengthMode)}
                  className={cx(
                    "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
                    glassTheme.text.primary,
                    glassTheme.glass.input,
                    glassTheme.border.softer,
                    "bg-transparent",
                  )}
                >
                  {BLOG_LENGTH_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          <GlassTextarea
            label="Topic or prompt"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Example: Why most businesses struggle with content"
          />

          <GlassInput
            label="Audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Business owners, creators, marketers"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                Platform focus
              </div>
              <select
                value={platformFocus}
                onChange={(e) =>
                  setPlatformFocus(
                    e.target.value as "instagram" | "tiktok" | "youtube" | "facebook" | "multi",
                  )
                }
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
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
              </select>
            </label>

            <label className="space-y-2">
              <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                Tone
              </div>
              <select
                value={tone}
                onChange={(e) =>
                  setTone(
                    e.target.value as
                      | "professional"
                      | "educational"
                      | "friendly"
                      | "direct"
                      | "confident"
                      | "high-energy",
                  )
                }
                className={cx(
                  "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
                  glassTheme.text.primary,
                  glassTheme.glass.input,
                  glassTheme.border.softer,
                  "bg-transparent",
                )}
              >
                <option value="professional">Professional</option>
                <option value="educational">Educational</option>
                <option value="friendly">Friendly</option>
                <option value="direct">Direct</option>
                <option value="confident">Confident</option>
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
                <div className={cx("mt-1 whitespace-pre-wrap text-sm leading-6", glassTheme.text.primary)}>
                  {preview.summary || "No summary returned."}
                </div>
              </div>

              {preview.bullets.length > 0 ? (
                <div className="space-y-2">
                  {preview.bullets.map((bullet, index) => (
                    <div
                      key={`${bullet}-${index}`}
                      className={cx(
                        "rounded-2xl border p-4 text-sm",
                        glassTheme.border.softer,
                        glassTheme.glass.panelSoft,
                        glassTheme.text.secondary,
                      )}
                    >
                      • {bullet}
                    </div>
                  ))}
                </div>
              ) : null}

              {preview.angles.length > 0 ? (
                <div className="space-y-3">
                  {preview.angles.map((angle, angleIndex) => {
                    const runningForVideo = runningAngleKey === `${angleIndex}:video`;
                    const runningForBlog = runningAngleKey === `${angleIndex}:blog`;
                    const runningForPost = runningAngleKey === `${angleIndex}:post`;
                    const runningForEmail = runningAngleKey === `${angleIndex}:email`;
                    const isSelected = selectedAngleIndex === angleIndex;

                    return (
                      <div
                        key={`${angle.title}-${angleIndex}`}
                        className={cx(
                          "rounded-2xl border p-4 space-y-3",
                          isSelected ? glassTheme.border.copper : glassTheme.border.softer,
                          glassTheme.glass.panelSoft,
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className={cx("text-base font-semibold", glassTheme.text.primary)}>
                            {angle.title}
                          </div>
                          {isSelected ? <GlassBadge tone="copper">Selected</GlassBadge> : null}
                        </div>

                        <div className={cx("text-sm leading-6", glassTheme.text.secondary)}>
                          {angle.angle}
                        </div>

                        <div className={cx("text-sm", glassTheme.text.primary)}>
                          <strong>Hook:</strong> {angle.hook}
                        </div>

                        <div className={cx("text-sm", glassTheme.text.primary)}>
                          <strong>Why it works:</strong> {angle.whyItWorks}
                        </div>

                        <div className={cx("text-sm", glassTheme.text.primary)}>
                          <strong>CTA:</strong> {angle.suggestedCta}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          <GlassButton
                            variant="ghost"
                            onClick={() => useAngle(angle, angleIndex)}
                            disabled={runningAngleKey !== null}
                          >
                            Use this angle
                          </GlassButton>

                          <GlassButton
                            variant="primary"
                            onClick={() => void generateFromAngle(angle, angleIndex, "video")}
                            disabled={runningAngleKey !== null}
                          >
                            {runningForVideo ? "Generating..." : "Video"}
                          </GlassButton>

                          <GlassButton
                            variant="secondary"
                            onClick={() => void generateFromAngle(angle, angleIndex, "blog")}
                            disabled={runningAngleKey !== null}
                          >
                            {runningForBlog ? "Generating..." : "Blog"}
                          </GlassButton>

                          <GlassButton
                            variant="secondary"
                            onClick={() => void generateFromAngle(angle, angleIndex, "post")}
                            disabled={runningAngleKey !== null}
                          >
                            {runningForPost ? "Generating..." : "Social"}
                          </GlassButton>

                          <GlassButton
                            variant="secondary"
                            onClick={() => void generateFromAngle(angle, angleIndex, "email")}
                            disabled={runningAngleKey !== null}
                          >
                            {runningForEmail ? "Generating..." : "Email"}
                          </GlassButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : (
            <div
              className={cx(
                "rounded-2xl border p-5 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary,
              )}
            >
              Build a topic or angle pack to see expanded topic, summary, and angle actions here.
            </div>
          )}
        </GlassCard>
      </section>
    </GlassShell>
  );
}
