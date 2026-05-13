import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export type YesNoTransitionQuestion = "assets_ready"|"idea_ready"|"output_approved"|"render_complete"|"publish_now";
export type RuntimeWorldTransitionRecommendation = { from: RuntimeWorldId; candidates: RuntimeWorldId[]; reason: string; };

const FLOW: Partial<Record<RuntimeWorldId, RuntimeWorldId[]>> = {
  idea:["campaign"], campaign:["generation"], upload:["asset_library"], asset_library:["generation"], generation:["review"], video_creation:["review"], review:["render"], render:["publish"], publish:["calendar","analytics"], analytics:["idea"], automation:["operations"], operations:["campaign","idea","review","render","publish"],
};

export function recommendTransitions(from: RuntimeWorldId): RuntimeWorldTransitionRecommendation {
  return { from, candidates: FLOW[from] ?? ["operations"], reason: "Deterministic lifecycle transition." };
}

export function recommendYesNoTransition(question: YesNoTransitionQuestion, answerYes: boolean): RuntimeWorldId[] {
  switch (question) {
    case "assets_ready": return answerYes ? ["generation", "campaign"] : ["upload"];
    case "idea_ready": return answerYes ? ["generation", "video_creation"] : ["idea"];
    case "output_approved": return answerYes ? ["render"] : ["review"];
    case "render_complete": return answerYes ? ["publish"] : ["render"];
    case "publish_now": return answerYes ? ["publish"] : ["calendar"];
  }
}
