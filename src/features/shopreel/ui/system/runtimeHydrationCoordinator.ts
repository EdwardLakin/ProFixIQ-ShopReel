import { runtimeSurfaceRegistry, type RuntimeSurfaceId } from "@/features/shopreel/ui/system/runtimeOrchestration";

export type RuntimeHydrationResult<T = unknown> = {
  status: "hydrated" | "partial" | "degraded";
  data: T | null;
  warnings: string[];
};

export async function hydrateRuntimeSurface<T>(surfaceId: RuntimeSurfaceId, hydrate: () => Promise<T>): Promise<RuntimeHydrationResult<T>> {
  const surface = runtimeSurfaceRegistry[surfaceId];
  try {
    const data = await hydrate();
    return { status: "hydrated", data, warnings: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Hydration failed";
    if (surface.hydrationRequirements.optional) {
      return { status: "partial", data: null, warnings: [message] };
    }
    return { status: "degraded", data: null, warnings: [message, "Using runtime fallback path."] };
  }
}
