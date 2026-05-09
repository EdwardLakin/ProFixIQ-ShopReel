import {
  deriveEcosystemState,
  readWorkspaceMemory,
  type WorkspaceMemory,
} from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { deriveEnvironmentReactivity } from "@/features/shopreel/ui/system/environmentReactivity";
import { deriveEnvironmentalField } from "@/features/shopreel/ui/system/environmentField";
import { deriveCognitiveState } from "@/features/shopreel/ui/system/cognitiveState";

export type EcosystemSurface = "home" | "create" | "campaigns" | "render" | "publish" | "library" | "review" | "editor";
export type EcosystemMode = "calm" | "continuity" | "render" | "campaign" | "publish" | "recovery";

export type EcosystemStateSnapshot = {
  ecosystemMode: EcosystemMode;
  operationalPressure: number;
  continuityHealth: number;
  renderPressure: number;
  exportMomentum: number;
  blockerFocus: number;
  reviewRisk: number;
  recoveryPriority: number;
  suggestedSurfaceAction: string;
  atmosphericLabel: string;
  compactReason: string;
};

const EMPTY_STATE: EcosystemStateSnapshot = {
  ecosystemMode: "calm",
  operationalPressure: 22,
  continuityHealth: 52,
  renderPressure: 18,
  exportMomentum: 26,
  blockerFocus: 20,
  reviewRisk: 24,
  recoveryPriority: 28,
  suggestedSurfaceAction: "Create new",
  atmosphericLabel: "calm continuity",
  compactReason: "No persisted workspace memory detected yet.",
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function chooseAction(snapshot: Omit<EcosystemStateSnapshot, "suggestedSurfaceAction">): string {
  if (snapshot.blockerFocus >= 68) return "Review blockers";
  if (snapshot.exportMomentum >= 70) return "Package ready assets";
  if (snapshot.continuityHealth <= 42) return "Restore workflow";
  if (snapshot.renderPressure >= 66) return "Inspect render queue";
  if (snapshot.reviewRisk >= 65) return "Review campaign/storyboard";
  return "Create or expand campaign";
}

export function deriveEcosystemStateSnapshot(memory: WorkspaceMemory | null): EcosystemStateSnapshot {
  if (!memory) return EMPTY_STATE;

  const readyTaskCount = memory.pendingTasks.filter((task) => task.done).length;
  const environment = deriveEnvironmentReactivity({ memory, readyTaskCount });
  const field = deriveEnvironmentalField({ memory, environment, readyTaskCount });
  const cognitive = deriveCognitiveState({ memory, environment, field, readyTaskCount });
  const ecosystem = memory.ecosystemState ?? deriveEcosystemState({
    pendingTaskCount: memory.pendingTasks.filter((task) => !task.done).length,
    readyTaskCount,
    blockerCount: memory.pendingTasks.filter((task) => !task.done && /review|render|verify|publish/i.test(task.label)).length,
    continuityThreadCount: memory.continuityThreads?.length ?? 0,
    interruptedWorkflow: memory.interruptedWorkflow,
    adaptiveMode: memory.adaptiveMode,
    minutesSinceUpdate: Math.max(0, Math.floor((Date.now() - new Date(memory.updatedAt).getTime()) / 60000)),
  });

  const operationalPressure = clamp((100 - cognitive.recoveryConfidence) * 0.38 + cognitive.renderAnxiety * 0.38 + ecosystem.operationalSaturation * 0.24);
  const continuityHealth = clamp(cognitive.continuityTrust * 0.7 + (100 - environment.continuityScarring) * 0.3);
  const renderPressure = clamp(cognitive.renderAnxiety * 0.72 + environment.structuralInstability * 0.28);
  const exportMomentum = clamp(cognitive.exportIntent * 0.62 + ecosystem.exportReadinessPressure * 0.38);
  const blockerFocus = clamp(memory.pendingTasks.filter((task) => !task.done && /review|render|verify|publish/i.test(task.label)).length * 22 + renderPressure * 0.45);
  const reviewRisk = clamp((100 - cognitive.continuityTrust) * 0.35 + cognitive.renderAnxiety * 0.35 + ecosystem.telemetryDensityPressure * 0.3);
  const recoveryPriority = clamp(cognitive.recoveryIntelligence * 0.55 + (100 - continuityHealth) * 0.45);

  const ecosystemMode: EcosystemMode = blockerFocus >= 68
    ? "recovery"
    : renderPressure >= 66
      ? "render"
      : exportMomentum >= 70
        ? "publish"
        : memory.adaptiveMode === "campaign"
          ? "campaign"
          : continuityHealth < 50
            ? "continuity"
            : "calm";

  const atmosphericLabel = environment.operationalWeather.pattern.replaceAll("_", " ");
  const compactReason = `Pressure ${operationalPressure} · continuity ${continuityHealth} · render ${renderPressure} · export ${exportMomentum}`;

  const base = { ecosystemMode, operationalPressure, continuityHealth, renderPressure, exportMomentum, blockerFocus, reviewRisk, recoveryPriority, atmosphericLabel, compactReason };
  return { ...base, suggestedSurfaceAction: chooseAction(base) };
}

export function readEcosystemStateSnapshot(): EcosystemStateSnapshot {
  if (typeof window === "undefined") return EMPTY_STATE;
  const memory = readWorkspaceMemory();
  return deriveEcosystemStateSnapshot(memory);
}
