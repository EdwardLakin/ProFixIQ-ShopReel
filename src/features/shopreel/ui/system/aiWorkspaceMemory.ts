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
  continuityThreads?: ContinuityThread[];
  intentSignals?: CreativeIntentSignals;
  updatedAt: string;
};

export type ContinuityThreadKind = "active_workflow" | "recovery" | "render_continuation" | "scene_path" | "export_lineage" | "campaign_evolution";

export type ContinuityThread = {
  id: string;
  kind: ContinuityThreadKind;
  label: string;
  route: string;
  status: "active" | "interrupted" | "resolved";
  priority: number;
  updatedAt: string;
};

export type CreativeIntentSignals = {
  pacingBias: "accelerated" | "balanced" | "cinematic";
  ctaBias: "direct" | "story-led" | "community-led";
  hookDensityBias: "high" | "moderate" | "low";
  exportStyleBias: "speed" | "balanced" | "craft";
  variantDirectionBias: "parallel" | "iterative" | "single";
  explainability: string[];
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

export function buildContinuityThreads(input: {
  intent: AiIntent;
  pendingTasks: WorkspaceTask[];
  interruptedWorkflow?: AiIntent;
  lastRoute: string;
  generationId?: string;
  campaignId?: string;
}): ContinuityThread[] {
  const now = new Date().toISOString();
  const workflowRoute = input.generationId ? `/shopreel/generations/${input.generationId}` : input.lastRoute;
  const campaignRoute = input.campaignId ? `/shopreel/campaigns/${input.campaignId}` : "/shopreel/campaigns";
  return [
    { id: "active-workflow", kind: "active_workflow", label: `Continue ${input.intent} workflow`, route: workflowRoute, status: "active", priority: 90, updatedAt: now },
    { id: "render-cont", kind: "render_continuation", label: "Render continuation rail", route: "/shopreel/render-queue", status: input.intent === "render" ? "active" : "resolved", priority: input.intent === "render" ? 94 : 52, updatedAt: now },
    { id: "export-lineage", kind: "export_lineage", label: "Export lineage thread", route: "/shopreel/exports", status: input.pendingTasks.some((x) => /package|export|publish/i.test(x.label)) ? "active" : "resolved", priority: 81, updatedAt: now },
    { id: "campaign-evo", kind: "campaign_evolution", label: "Campaign evolution thread", route: campaignRoute, status: input.intent === "campaign" ? "active" : "resolved", priority: 73, updatedAt: now },
    { id: "scene-path", kind: "scene_path", label: "Unresolved scene path", route: workflowRoute, status: input.pendingTasks.some((x) => /storyboard|review/i.test(x.label)) ? "active" : "resolved", priority: 76, updatedAt: now },
    { id: "recovery", kind: "recovery", label: "Interrupted recovery", route: input.lastRoute, status: input.interruptedWorkflow ? "interrupted" : "resolved", priority: input.interruptedWorkflow ? 92 : 44, updatedAt: now },
  ];
}

export function evolveCreativeIntentSignals(memory: CreativeContinuityMemory): CreativeIntentSignals {
  const hookDensityBias: CreativeIntentSignals["hookDensityBias"] =
    memory.pacingPreference === "high_energy" || memory.editingRhythm === "rapid" ? "high" : memory.editingRhythm === "longform" ? "low" : "moderate";
  const exportStyleBias: CreativeIntentSignals["exportStyleBias"] =
    memory.platformBias === "tiktok" ? "speed" : memory.tonePreference === "commercial_clean" ? "craft" : "balanced";
  return {
    pacingBias: memory.pacingPreference === "cinematic" ? "cinematic" : memory.pacingPreference === "steady" ? "balanced" : "accelerated",
    ctaBias: memory.ctaStyle === "community" ? "community-led" : memory.ctaStyle === "soft" ? "story-led" : "direct",
    hookDensityBias,
    exportStyleBias,
    variantDirectionBias: memory.variantPreference === "parallel_variants" ? "parallel" : memory.variantPreference === "iterative_branching" ? "iterative" : "single",
    explainability: [
      `Pacing inferred from ${memory.pacingPreference} + ${memory.editingRhythm}.`,
      `CTA bias inferred from ${memory.ctaStyle}.`,
      `Export bias inferred from ${memory.platformBias} + ${memory.tonePreference}.`,
    ],
  };
}
