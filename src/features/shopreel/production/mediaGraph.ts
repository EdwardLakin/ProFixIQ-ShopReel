export type ProductionNodeKind =
  | "campaign"
  | "generation"
  | "storyboard"
  | "scene"
  | "asset"
  | "voiceover"
  | "overlay"
  | "variant"
  | "render"
  | "export";

export type ProductionNode = {
  id: string;
  kind: ProductionNodeKind;
  label: string;
  status: "ready" | "partial" | "missing";
  detail?: string;
};

export type ProductionEdge = {
  from: string;
  to: string;
  relation:
    | "contains"
    | "supports"
    | "drives"
    | "derived_from"
    | "renders_to"
    | "packages_to";
};

export type SceneDraft = {
  id: string;
  title: string;
  role: string;
  durationSeconds: number | null;
  overlayText?: string | null;
  voiceoverText?: string | null;
  media?: Array<{ id?: string; assetId?: string; url?: string | null; type?: string }>;
};

export type MediaGraphInput = {
  generationId: string;
  campaignId?: string | null;
  storyboardLabel?: string;
  hook?: string | null;
  cta?: string | null;
  caption?: string | null;
  scenes: SceneDraft[];
};

export function buildProductionMediaGraph(input: MediaGraphInput): { nodes: ProductionNode[]; edges: ProductionEdge[] } {
  const nodes: ProductionNode[] = [];
  const edges: ProductionEdge[] = [];
  const campaignId = input.campaignId ?? `campaign:${input.generationId}`;
  const generationNodeId = `generation:${input.generationId}`;
  const storyboardNodeId = `storyboard:${input.generationId}`;

  nodes.push({ id: campaignId, kind: "campaign", label: "Campaign", status: "ready" });
  nodes.push({ id: generationNodeId, kind: "generation", label: `Generation ${input.generationId.slice(0, 8)}`, status: "ready" });
  nodes.push({ id: storyboardNodeId, kind: "storyboard", label: input.storyboardLabel ?? "Storyboard draft", status: input.scenes.length > 0 ? "ready" : "partial" });

  edges.push({ from: campaignId, to: generationNodeId, relation: "contains" });
  edges.push({ from: generationNodeId, to: storyboardNodeId, relation: "contains" });

  for (const scene of input.scenes) {
    const sceneNodeId = `scene:${scene.id}`;
    nodes.push({ id: sceneNodeId, kind: "scene", label: scene.title, status: "ready", detail: `${scene.durationSeconds ?? 0}s · ${scene.role}` });
    edges.push({ from: storyboardNodeId, to: sceneNodeId, relation: "contains" });

    if ((scene.voiceoverText ?? "").trim().length > 0) {
      const voiceNodeId = `voiceover:${scene.id}`;
      nodes.push({ id: voiceNodeId, kind: "voiceover", label: `Voiceover ${scene.title}`, status: "ready" });
      edges.push({ from: sceneNodeId, to: voiceNodeId, relation: "supports" });
    }

    if ((scene.overlayText ?? "").trim().length > 0) {
      const overlayNodeId = `overlay:${scene.id}`;
      nodes.push({ id: overlayNodeId, kind: "overlay", label: `Overlay ${scene.title}`, status: "ready" });
      edges.push({ from: sceneNodeId, to: overlayNodeId, relation: "supports" });
    }

    for (const [index, media] of (scene.media ?? []).entries()) {
      const assetId = media.assetId ?? media.id ?? `${scene.id}-${index}`;
      const assetNodeId = `asset:${assetId}`;
      const mediaType = (media.type ?? "asset").toLowerCase();
      nodes.push({ id: assetNodeId, kind: "asset", label: `${mediaType} for ${scene.title}`, status: media.url ? "ready" : "partial" });
      edges.push({ from: sceneNodeId, to: assetNodeId, relation: "supports" });
    }
  }

  const baseVariantNodeId = `variant:base:${input.generationId}`;
  nodes.push({ id: baseVariantNodeId, kind: "variant", label: "Base cut", status: "partial" });
  edges.push({ from: storyboardNodeId, to: baseVariantNodeId, relation: "derived_from" });

  return { nodes, edges };
}

export function deriveSceneIntelligence(input: MediaGraphInput): string[] {
  const notes: string[] = [];
  if (input.scenes.length === 0) return ["No scenes present. Build scene beats before render orchestration."];

  if ((input.hook ?? "").trim().length < 24) notes.push("Hook is short. Consider a stronger opening tension in the first scene.");
  if ((input.cta ?? "").trim().length < 8) notes.push("CTA ending is weak or missing. Add a clear action close.");

  const captionWordCount = (input.caption ?? "").trim().split(/\s+/).filter(Boolean).length;
  if (captionWordCount > 40) notes.push("Caption density is high. Reduce to improve scanability in-feed.");

  for (const [index, scene] of input.scenes.entries()) {
    if ((scene.media?.length ?? 0) === 0) notes.push(`Scene ${index + 1} has no supporting asset attached.`);
    if ((scene.voiceoverText ?? "").trim().length === 0) notes.push(`Scene ${index + 1} has no voiceover guidance.`);
    if ((scene.overlayText ?? "").trim().length > 120) notes.push(`Scene ${index + 1} overlay is text-heavy; reduce visual clutter.`);
  }

  return notes.slice(0, 8);
}

export function deriveAssetAwareness(scenes: SceneDraft[]): string[] {
  const media = scenes.flatMap((scene) => scene.media ?? []);
  if (media.length === 0) return ["No media attached yet. Upload footage or images to start assembly."];

  const typed = media.map((item) => (item.type ?? "unknown").toLowerCase());
  const hasVertical = typed.some((type) => /vertical|9:16|portrait/.test(type));
  const onlyImages = typed.every((type) => /image|photo|jpg|jpeg|png|still/.test(type));
  const hasBroll = typed.some((type) => /b-roll|broll/.test(type));

  const notes: string[] = [];
  if (!hasVertical) notes.push("No vertical footage detected for short-form distribution.");
  if (onlyImages) notes.push("Only static images detected; motion coverage may feel limited.");
  if (!hasBroll) notes.push("No supporting B-roll detected for pacing transitions.");
  if (media.length < Math.max(3, scenes.length)) notes.push("Footage volume looks thin for a 20-30s pacing target.");

  return notes.length > 0 ? notes : ["Media coverage looks usable for current scene plan."];
}
