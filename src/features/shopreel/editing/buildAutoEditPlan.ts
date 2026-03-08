import { buildSubtitleBlocks } from "@/features/shopreel/subtitles/buildSubtitleBlocks";
import { buildRenderPayload, type RenderPayload } from "@/features/shopreel/render/buildRenderPayload";

export type AutoEditInput = {
  title: string;
  contentType: string;
  hook: string;
  caption: string;
  cta: string;
  transcript: string;
  durationMs?: number;
  visualUrls?: string[];
};

export type AutoEditPlan = {
  editStyle: "fast_punchy";
  thumbnailText: string;
  subtitleStyle: {
    preset: "bold_shopreel";
    position: "lower_third";
    maxWordsPerBlock: number;
  };
  cuts: Array<{
    atMs: number;
    reason: string;
  }>;
  subtitles: ReturnType<typeof buildSubtitleBlocks>;
  renderPayload: RenderPayload;
};

function buildThumbnailText(hook: string, title: string): string {
  const source = hook.trim() || title.trim() || "Repair story";
  return source.length > 52 ? `${source.slice(0, 49)}...` : source;
}

function buildCutPoints(durationMs: number): Array<{ atMs: number; reason: string }> {
  const cuts: Array<{ atMs: number; reason: string }> = [];
  const interval = 1400;

  for (let atMs = interval; atMs < durationMs; atMs += interval) {
    cuts.push({
      atMs,
      reason: "Keep pacing tight for short-form video",
    });
  }

  return cuts;
}

export function buildAutoEditPlan(input: AutoEditInput): AutoEditPlan {
  const durationMs = input.durationMs ?? 12000;
  const visualUrls = input.visualUrls ?? [];

  const subtitles = buildSubtitleBlocks(input.transcript, durationMs);

  const renderPayload = buildRenderPayload({
    title: input.title,
    hook: input.hook,
    caption: input.caption,
    cta: input.cta,
    transcript: input.transcript,
    durationMs,
    visualUrls,
    subtitleBlocks: subtitles,
  });

  return {
    editStyle: "fast_punchy",
    thumbnailText: buildThumbnailText(input.hook, input.title),
    subtitleStyle: {
      preset: "bold_shopreel",
      position: "lower_third",
      maxWordsPerBlock: 5,
    },
    cuts: buildCutPoints(durationMs),
    subtitles,
    renderPayload,
  };
}
