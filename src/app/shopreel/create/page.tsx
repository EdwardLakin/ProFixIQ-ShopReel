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

type CreatorAngle = {
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
      generationId?: string;
      editorUrl?: string;
      expandedTopic?: string;
      researchSummary?: string;
      researchBullets?: string[];
      angles?: CreatorAngle[];
    }
  | {
      ok?: false;
      error?: string;
    };

export default function ShopReelCreatePage() {
  const router = useRouter();
  const [mode, setMode] = useState<CreatorMode>("research_script");
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
    expandedTopic?: string;
    summary: string;
    bullets: string[];
    angles: CreatorAngle[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitCreatorRequest() {
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
          topic,
          audience,
          platformFocus,
          tone,
          sourceText,
          sourceUrl,
        }),
      });

      const json = (await res.json()) as CreateResponse;

      if (!res.ok || !json.ok) {
        throw new Error(("error" in json && json.error) || "Failed to create story");
      }

      setPreview({
        expandedTopic: json.expandedTopic,
        summary: json.researchSummary ?? "",
        bullets: json.researchBullets ?? [],
        angles: json.angles ?? [],
      });

      if (json.editorUrl) {
        router.push(json.editorUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create story");
    } finally {
      setIsSubmitting(false);
    }
  }

  const primaryButtonLabel =
    mode === "angle_pack"
      ? "Generate angle pack"
      : mode === "debunk"
      ? "Build debunk script"
      : mode === "stitch"
      ? "Build stitch script"
      : "Build creator script";

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Creator Mode"
      subtitle="Topic expansion, angle generation, debunk mode, stitch responses, and creator-first scripting."
      actions={<GlassBadge tone="copper">Creator research + script</GlassBadge>}
    >
      <ShopReelNav />

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassCard
          label="Start From Topic"
          title="Topic → research → angles → script → editor"
          description="Use one creator workflow for explainers, rumors, debunks, stitches, and multi-post angle packs."
          strong
          footer={
            <div className="flex flex-wrap gap-3">
              <GlassButton
                variant="primary"
                onClick={() => void submitCreatorRequest()}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Working..." : primaryButtonLabel}
              </GlassButton>
            </div>
          }
        >
          <div className="grid gap-2 md:grid-cols-2">
            {[
              { value: "research_script", label: "Research + script" },
              { value: "angle_pack", label: "Story angle generator" },
              { value: "debunk", label: "Debunk" },
              { value: "stitch", label: "Stitch response" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setMode(item.value as CreatorMode)}
                className={cx(
                  "rounded-2xl border px-4 py-3 text-left text-sm transition",
                  mode === item.value
                    ? "border-sky-400/30 bg-sky-400/10 text-white"
                    : "border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

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
            placeholder="Example: Apple fans, smartphone buyers, creators"
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

          {(mode === "debunk" || mode === "stitch") ? (
            <>
              <GlassTextarea
                label={mode === "debunk" ? "Claim to challenge" : "Original take to respond to"}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder={
                  mode === "debunk"
                    ? "Paste the claim, rumor, or talking point you want to challenge."
                    : "Paste the original statement or transcript you want to stitch against."
                }
              />

              <GlassInput
                label="Source URL"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="Optional video, post, or article URL"
              />
            </>
          ) : null}

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
          label="Creator Engine"
          title="What this unlocks"
          description="One creator workspace for short-form scripting and expansion."
          strong
        >
          <div className="grid gap-3">
            {[
              "Topic expansion",
              "Angle packs",
              "Debunk videos",
              "Stitch responses",
              "Review / rumor explainers",
              "Multiple post ideas from one prompt",
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

          {preview ? (
            <div className="space-y-3 pt-2">
              {preview.expandedTopic ? (
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
              ) : null}

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

              {preview.angles.length > 0 ? (
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
                      <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                        {angle.title}
                      </div>
                      <div className={cx("mt-1 text-sm", glassTheme.text.secondary)}>
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
              ) : null}
            </div>
          ) : null}
        </GlassCard>
      </section>
    </GlassShell>
  );
}
