"use client";

import type { AiIntent } from "@/features/shopreel/ui/system/AiCommandPrimitives";

export type WorkspaceTask = {
  id: string;
  label: string;
  route: string;
  done: boolean;
};

export type WorkspaceMemory = {
  lastWorkflow: AiIntent;
  lastCampaignId?: string;
  lastRenderContextRoute?: string;
  lastGenerationId?: string;
  lastCommand: string;
  lastRoute: string;
  recentIntents: AiIntent[];
  intentHistory: string[];
  pendingTasks: WorkspaceTask[];
  interruptedWorkflow?: AiIntent;
  adaptiveMode?: "render" | "campaign" | "packaging" | "scene" | "publish" | "variant" | "balanced";
  creativeContinuity?: CreativeContinuityMemory;
  updatedAt: string;
};

export type CreativeContinuityMemory = {
  pacingPreference: "high_energy" | "steady" | "cinematic";
  tonePreference: "founder_story" | "commercial_clean" | "direct_response";
  hookStyle: "pattern_break" | "narrative" | "problem_first";
  ctaStyle: "direct" | "soft" | "community";
  visualEnergy: "kinetic" | "balanced" | "minimal";
  editingRhythm: "rapid" | "mixed" | "longform";
  captionDensity: "light" | "medium" | "dense";
  platformBias: "tiktok" | "instagram" | "youtube_shorts";
  variantPreference: "single_best" | "parallel_variants" | "iterative_branching";
  structurePattern: "hook-proof-cta" | "problem-solution-cta" | "story-payoff-cta";
};

export const WORKSPACE_MEMORY_KEY = "shopreel-workspace-memory-v2";

export function readWorkspaceMemory(): WorkspaceMemory | null {
  const raw = window.localStorage.getItem(WORKSPACE_MEMORY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WorkspaceMemory;
  } catch {
    return null;
  }
}

export function writeWorkspaceMemory(memory: WorkspaceMemory): void {
  window.localStorage.setItem(WORKSPACE_MEMORY_KEY, JSON.stringify(memory));
}

export function defaultCreativeContinuityMemory(): CreativeContinuityMemory {
  return {
    pacingPreference: "high_energy",
    tonePreference: "founder_story",
    hookStyle: "pattern_break",
    ctaStyle: "direct",
    visualEnergy: "kinetic",
    editingRhythm: "rapid",
    captionDensity: "light",
    platformBias: "tiktok",
    variantPreference: "parallel_variants",
    structurePattern: "hook-proof-cta",
  };
}

export function buildPendingTasks(intent: AiIntent): WorkspaceTask[] {
  const map: Record<AiIntent, WorkspaceTask[]> = {
    campaign: [
      { id: "concept", label: "Create concept", route: "/shopreel/campaigns", done: true },
      { id: "storyboard", label: "Build storyboard", route: "/shopreel/editor", done: false },
      { id: "review", label: "Review assets", route: "/shopreel/generations", done: false },
      { id: "render", label: "Render outputs", route: "/shopreel/render-queue", done: false },
      { id: "package", label: "Package for publish", route: "/shopreel/exports", done: false },
    ],
    render: [
      { id: "review-renders", label: "Review render exceptions", route: "/shopreel/render-queue", done: false },
      { id: "package-renders", label: "Package ready outputs", route: "/shopreel/exports", done: false },
    ],
    publish: [
      { id: "final-check", label: "Verify export package", route: "/shopreel/exports", done: false },
      { id: "publish", label: "Publish ready assets", route: "/shopreel/publish-queue", done: false },
    ],
    latest: [{ id: "resume", label: "Continue last generation", route: "/shopreel/generations", done: false }],
    create: [{ id: "draft", label: "Seed next draft", route: "/shopreel/create", done: false }],
    library: [{ id: "curate", label: "Curate campaign-ready assets", route: "/shopreel/library", done: false }],
    ideas: [{ id: "angles", label: "Develop campaign angles", route: "/shopreel/ideas", done: false }],
    editor: [{ id: "revise", label: "Complete draft revision", route: "/shopreel/editor", done: false }],
    unknown: [],
  };
  return map[intent];
}
