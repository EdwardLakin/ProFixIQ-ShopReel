import type { SubtitleBlock } from "@/features/shopreel/subtitles/buildSubtitleBlocks";

export type RenderPayloadInput = {
  title: string;
  hook: string;
  caption: string;
  cta: string;
  transcript: string;
  durationMs: number;
  visualUrls: string[];
  subtitleBlocks: SubtitleBlock[];
};

export type RenderPayload = {
  aspectRatio: "9:16";
  durationMs: number;
  scenes: Array<{
    kind: "hook" | "problem" | "repair" | "result";
    startMs: number;
    endMs: number;
    overlayText: string;
    visualUrl: string | null;
  }>;
  subtitles: SubtitleBlock[];
  exportTargets: Array<"tiktok" | "instagram" | "youtube">;
  metadata: {
    title: string;
    caption: string;
    cta: string;
    transcript: string;
  };
};

export function buildRenderPayload(input: RenderPayloadInput): RenderPayload {
  const quarter = Math.max(1000, Math.floor(input.durationMs / 4));

  const visuals = [...input.visualUrls];
  while (visuals.length < 4) {
    visuals.push(visuals[visuals.length - 1] ?? null);
  }

  return {
    aspectRatio: "9:16",
    durationMs: input.durationMs,
    scenes: [
      {
        kind: "hook",
        startMs: 0,
        endMs: quarter,
        overlayText: input.hook,
        visualUrl: visuals[0] ?? null,
      },
      {
        kind: "problem",
        startMs: quarter,
        endMs: quarter * 2,
        overlayText: "Here’s what we found",
        visualUrl: visuals[1] ?? null,
      },
      {
        kind: "repair",
        startMs: quarter * 2,
        endMs: quarter * 3,
        overlayText: "Here’s how we fixed it",
        visualUrl: visuals[2] ?? null,
      },
      {
        kind: "result",
        startMs: quarter * 3,
        endMs: input.durationMs,
        overlayText: input.cta,
        visualUrl: visuals[3] ?? null,
      },
    ],
    subtitles: input.subtitleBlocks,
    exportTargets: ["tiktok", "instagram", "youtube"],
    metadata: {
      title: input.title,
      caption: input.caption,
      cta: input.cta,
      transcript: input.transcript,
    },
  };
}
