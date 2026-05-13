import type { OperatorWorldCard } from "@/features/shopreel/operator/operatorWorlds";
import { RUNTIME_WORLD_MAP, type RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";
import { resolveWorldFromEntityKind } from "@/features/shopreel/ui/system/pageToWorldAdapter";

export type RuntimeWorldProgress = { status: "partial"|"unknown"|"active"; completionSignal: "none"|"inferred"; note: string };
export type RuntimeWorldBlocker = { key: string; message: string; severity: "low"|"medium"|"high" };
export type RuntimeWorldRecommendation = { actionId: string; route: string; reason: string };
export type RuntimeWorldSnapshot = { worldId: RuntimeWorldId; partial: boolean; progress: RuntimeWorldProgress; blockers: RuntimeWorldBlocker[]; recommendation: RuntimeWorldRecommendation | null; contextEntity: { kind: string; id: string } | null };
export type RuntimeWorldDeckCard = { worldId: RuntimeWorldId; label: string; entryLabel: string; href: string; recommendation: string; partial: boolean };

export function deriveWorldProgress(world: OperatorWorldCard | null): RuntimeWorldProgress {
  if (!world) return { status: "unknown", completionSignal: "none", note: "No world entity available." };
  if (/blocked|failed/.test(world.normalizedStatus)) return { status: "partial", completionSignal: "inferred", note: "Blocked state detected." };
  if (/in_progress|review|approval|pending/.test(world.normalizedStatus)) return { status: "active", completionSignal: "inferred", note: "In-progress lifecycle state." };
  return { status: "partial", completionSignal: "inferred", note: "Status mapped from persisted entity." };
}
export function deriveWorldBlockers(world: OperatorWorldCard | null): RuntimeWorldBlocker[] {
  if (!world) return [{ key:"missing_context", message:"World data unavailable.", severity:"medium" }];
  if (/blocked|failed/.test(world.normalizedStatus)) return [{ key:"status_blocked", message:`${world.title} is ${world.normalizedStatus}.`, severity:"high" }];
  return [];
}
export function deriveWorldRecommendation(worldId: RuntimeWorldId, world: OperatorWorldCard | null): RuntimeWorldRecommendation {
  const def = RUNTIME_WORLD_MAP[worldId];
  return { actionId: def.primaryActions[0]?.id ?? "open", route: world?.href ?? def.canonicalRoute, reason: world ? "Use selected world entity." : "Fallback to canonical world route." };
}
export function buildWorldSnapshot(world: OperatorWorldCard | null): RuntimeWorldSnapshot {
  const worldId = world ? resolveWorldFromEntityKind(world.kind) : "operations";
  return { worldId, partial: !world, progress: deriveWorldProgress(world), blockers: deriveWorldBlockers(world), recommendation: deriveWorldRecommendation(worldId, world), contextEntity: world ? { kind: world.kind, id: world.id } : null };
}
export function buildWorldDeckCard(world: OperatorWorldCard): RuntimeWorldDeckCard {
  const snapshot = buildWorldSnapshot(world);
  const def = RUNTIME_WORLD_MAP[snapshot.worldId];
  return { worldId: snapshot.worldId, label: def.shortLabel, entryLabel: def.operatorCopy.entryLabel, href: world.href, recommendation: snapshot.recommendation?.reason ?? "", partial: snapshot.partial };
}
