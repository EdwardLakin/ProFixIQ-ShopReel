export type RuntimeEntityKind = "campaign" | "generation" | "upload" | "render" | "review" | "approval" | "operator_memory" | "temporal_artifact" | "blocker" | "workflow" | "command";
export type RuntimeEntityPosition = { plane: "foreground" | "midground" | "operator" | "peripheral" | "background"; x: number; y: number; z: number };
export type RuntimeEntityPresence = "active" | "latent" | "blocked" | "resolved";
export type RuntimeEntityWeight = { priority: number; urgency: number; confidence: number };
export type RuntimeEntityRelationship = { targetId: string; relation: "depends_on" | "supports" | "blocks" | "recovers" };
export type RuntimeEntityActionSurface = { mode: "focal" | "supporting" | "background" | "operator_guided" | "escape"; href: string | null; label: string };
export type RuntimeEntity = { id: string; kind: RuntimeEntityKind; title: string; presence: RuntimeEntityPresence; position: RuntimeEntityPosition; weight: RuntimeEntityWeight; relationships: RuntimeEntityRelationship[]; actionSurface: RuntimeEntityActionSurface | null };
