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

type CreateResponse =
  | {
      ok: true;
      sourceId: string;
      contentPieceId: string;
      generationId: string;
      editorUrl: string;
      reviewUrl: string;
    }
  | {
      ok?: false;
      error?: string;
    };

export default function ShopReelCreatePage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [audience, setAudience] = useState("");
  const [platformFocus, setPlatformFocus] = useState<
    "instagram" | "tiktok" | "youtube" | "facebook" | "multi"
  >("multi");
  const [tone, setTone] = useState<
    "professional" | "educational" | "friendly" | "direct" | "confident" | "high-energy"
  >("confident");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createFromIdea() {
    try {
      setError(null);
      setIsSubmitting(true);

      const res = await fetch("/api/shopreel/create/from-idea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idea,
          audience,
          platformFocus,
          tone,
        }),
      });

      const json = (await res.json()) as CreateResponse;

      if (!res.ok || !json.ok) {
        throw new Error(("error" in json && json.error) || "Failed to create story");
      }

      router.push(json.editorUrl);
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
      subtitle="Start from an idea, topic, review, or script concept. ShopReel turns it into a story draft and opens the editor."
      actions={
        <GlassBadge tone="copper">Multi-market mode</GlassBadge>
      }
    >
      <ShopReelNav />

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassCard
          label="Start From Idea"
          title="Idea → Story → Editor"
          description="This is the Creator Mode entry point. Describe what you want to make and ShopReel builds the first draft."
          strong
          footer={
            <div className="flex flex-wrap gap-3">
              <GlassButton
                variant="primary"
                onClick={() => void createFromIdea()}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create story"}
              </GlassButton>
            </div>
          }
        >
          <GlassTextarea
            label="What do you want to make?"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Example: Review the new iPhone camera in a short creator-style breakdown with a strong hook and quick verdict."
          />

          <GlassInput
            label="Audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Example: tech buyers, truck owners, moms, fitness beginners"
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
          label="Creator Mode"
          title="What this unlocks"
          description="Same engine, different entry point."
          strong
        >
          <div className="grid gap-3">
            {[
              "Product reviews",
              "Daily creator content",
              "Topic explainers",
              "Unboxings",
              "Talking-head breakdowns",
              "Short-form educational clips",
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

          <div className="grid gap-3 pt-2 md:grid-cols-2">
            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.copper,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-sm", glassTheme.text.secondary)}>Flow</div>
              <div className={cx("mt-1 text-base font-medium", glassTheme.text.primary)}>
                Idea → Draft → Editor
              </div>
            </div>

            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.copper,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-sm", glassTheme.text.secondary)}>Works with</div>
              <div className={cx("mt-1 text-base font-medium", glassTheme.text.primary)}>
                Any visual niche
              </div>
            </div>
          </div>
        </GlassCard>
      </section>
    </GlassShell>
  );
}
