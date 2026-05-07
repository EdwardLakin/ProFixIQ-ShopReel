import type { GrowthPlatform } from "./types";

export type DraftSeed = { platform: GrowthPlatform; format: string; title: string; body: string; hook: string; cta: string };

export function buildDraftSeeds(featureTitle: string, featureDescription: string, platforms: GrowthPlatform[]): DraftSeed[] {
  const seeds: DraftSeed[] = [];
  for (const platform of platforms) {
    if (platform === "instagram" || platform === "tiktok" || platform === "youtube_shorts") {
      seeds.push({ platform, format: "short_video_script", title: `${featureTitle}: 30-second breakdown`, hook: `Most teams ship content too slowly. ${featureTitle} fixes that.`, body: `Scene 1 (0-5s): problem. Scene 2 (5-20s): show ${featureTitle}. Scene 3 (20-35s): before/after outcome. Scene 4 (35-40s): CTA.`, cta: "Comment \"workflow\" for the checklist." });
      seeds.push({ platform, format: "caption", title: `${featureTitle} caption`, hook: `From idea to asset without chaos.`, body: `${featureDescription}\n\nBuilt for practical teams that need speed with control.`, cta: "Save this for your next launch sprint." });
      seeds.push({ platform, format: "thumbnail_prompt", title: `${featureTitle} thumbnail`, hook: "", body: `Minimal premium thumbnail: ${featureTitle}, dark slate background, high contrast, product-led UI framing.`, cta: "" });
    } else if (platform === "linkedin" || platform === "x") {
      seeds.push({ platform, format: "launch_post", title: `${featureTitle} launch post`, hook: `We just tightened our ${featureTitle} workflow.`, body: `Problem: fragmented campaign drafting.\nSolution: deterministic scan + reviewed drafts.\nResult: faster launch cycles with human approval intact.`, cta: "If you run content ops, I can share the internal rubric." });
    } else {
      seeds.push({ platform, format: "blog_outline", title: `${featureTitle}: internal launch playbook`, hook: `A practical system for turning product work into market-ready stories.`, body: `1) Problem\n2) What changed\n3) Workflow walkthrough\n4) Safety controls\n5) Next phase`, cta: "Read the full breakdown and adapt it to your team." });
    }
  }
  return seeds;
}
