import type { CommandInputIntent } from "@/features/shopreel/ui/system/commandInputIntent";
import type {
  OperatorRuntimeIntent,
  OperatorRuntimeResolution,
  OperatorRuntimeState,
  OperatorSurfaceId,
  OperatorTransitionMode,
} from "@/features/shopreel/ui/system/operatorRuntime";

const includesAny = (value: string, patterns: RegExp[]) => patterns.some((pattern) => pattern.test(value));

const CAMPAIGN_PATTERNS = [/\bcampaign\b/, /\blaunch\b/, /\bnew idea\b/, /\bcreate\b/];
const REVIEW_PATTERNS = [/\breview\b/, /\bapproval\b/, /\bapprove\b/, /\bdecision\b/];
const REFINE_PATTERNS = [/\brefine\b/, /\bchange\b/, /\btone\b/, /\bedit\b/];
const ASSET_PATTERNS = [/\basset\b/, /\bupload\b/, /\blibrary\b/, /\bmedia\b/];
const PUBLISH_PATTERNS = [/\bpublish\b/, /\bpackage\b/, /\bexport\b/];
const MANUAL_PATTERNS = [/\boperations\b/, /\bmanual\b/, /\btools\b/, /\brender queue\b/, /\badmin\b/];

function fromInputIntent(intent?: CommandInputIntent): OperatorRuntimeIntent {
  if (!intent || intent === "unknown") return "unknown";
  return intent;
}

function buildResolution(input: {
  rawCommand: string;
  interpretedIntent: OperatorRuntimeIntent;
  state: OperatorRuntimeState;
  surfaceId: OperatorSurfaceId;
  transitionMode: OperatorTransitionMode;
  confidence: "low" | "medium" | "high";
  summary: string;
  recommendedRouteFallback: string;
  selectedCampaignId?: string | null;
  hasPendingApprovals?: boolean;
  hasActiveCampaign?: boolean;
  hasAssetsContext?: boolean;
}): OperatorRuntimeResolution {
  return {
    state: input.state,
    surfaceId: input.surfaceId,
    transitionMode: input.transitionMode,
    confidence: input.confidence,
    summary: input.summary,
    recommendedRouteFallback: input.recommendedRouteFallback,
    contextCarryover: {
      rawCommand: input.rawCommand,
      interpretedIntent: input.interpretedIntent,
      selectedCampaignId: input.selectedCampaignId ?? null,
      hasPendingApprovals: Boolean(input.hasPendingApprovals),
      hasActiveCampaign: Boolean(input.hasActiveCampaign),
      hasAssetsContext: Boolean(input.hasAssetsContext),
    },
  };
}

export function resolveOperatorRuntime(input: {
  rawCommand: string;
  classifiedIntent?: CommandInputIntent;
  currentPath?: string;
  selectedCampaignId?: string | null;
  hasPendingApprovals?: boolean;
  hasActiveCampaign?: boolean;
  hasAssetsContext?: boolean;
}): OperatorRuntimeResolution {
  const prompt = input.rawCommand.toLowerCase().trim();
  const interpretedIntent = fromInputIntent(input.classifiedIntent);
  const context = {
    selectedCampaignId: input.selectedCampaignId,
    hasPendingApprovals: input.hasPendingApprovals,
    hasActiveCampaign: input.hasActiveCampaign,
    hasAssetsContext: input.hasAssetsContext,
  };

  if (!prompt) {
    return buildResolution({ rawCommand: input.rawCommand, interpretedIntent, state: "idle", surfaceId: "idle_command", transitionMode: "route_fallback", confidence: "medium", summary: "Operator is ready for your next command.", recommendedRouteFallback: input.currentPath || "/shopreel", ...context });
  }
  if (includesAny(prompt, MANUAL_PATTERNS)) {
    return buildResolution({ rawCommand: input.rawCommand, interpretedIntent: "manual_operations", state: "manual_operations_mode", surfaceId: "manual_operations", transitionMode: "guided_handoff", confidence: "high", summary: "Manual operations tools are best for this request.", recommendedRouteFallback: "/shopreel/operations", ...context });
  }
  if (includesAny(prompt, PUBLISH_PATTERNS)) {
    return buildResolution({ rawCommand: input.rawCommand, interpretedIntent: "publish", state: "assembling_package", surfaceId: "publish_package_review", transitionMode: "inline_materialize", confidence: "high", summary: "ShopReel can assemble a publish-ready package from here.", recommendedRouteFallback: "/shopreel/publish-center", ...context });
  }
  if (includesAny(prompt, REVIEW_PATTERNS) || input.hasPendingApprovals) {
    return buildResolution({ rawCommand: input.rawCommand, interpretedIntent: "review", state: "reviewing_decision", surfaceId: "review_inbox", transitionMode: "inline_materialize", confidence: "high", summary: "Review decisions are ready to be handled in the inbox flow.", recommendedRouteFallback: "/shopreel/review", ...context });
  }
  if (includesAny(prompt, REFINE_PATTERNS)) {
    return buildResolution({ rawCommand: input.rawCommand, interpretedIntent: "refine", state: "refining_output", surfaceId: "campaign_workspace", transitionMode: "inline_materialize", confidence: "medium", summary: "Refinement can continue against the active campaign workspace.", recommendedRouteFallback: input.selectedCampaignId ? `/shopreel/campaigns/${input.selectedCampaignId}` : "/shopreel/campaigns", ...context });
  }
  if (includesAny(prompt, ASSET_PATTERNS)) {
    if (input.hasAssetsContext) {
      return buildResolution({ rawCommand: input.rawCommand, interpretedIntent: "asset_intake", state: "generating_draft", surfaceId: "asset_intake", transitionMode: "inline_materialize", confidence: "medium", summary: "Asset context is available; intake can continue inline.", recommendedRouteFallback: "/shopreel/library", ...context });
    }
    return buildResolution({ rawCommand: input.rawCommand, interpretedIntent: "asset_intake", state: "blocked_missing_input", surfaceId: "blocked_recovery", transitionMode: "guided_handoff", confidence: "high", summary: "Asset request detected, but more files/context are needed before proceeding.", recommendedRouteFallback: "/shopreel/library", ...context });
  }
  if (includesAny(prompt, CAMPAIGN_PATTERNS) || input.classifiedIntent === "create_campaign") {
    return buildResolution({ rawCommand: input.rawCommand, interpretedIntent: "create_campaign", state: "planning_campaign", surfaceId: "campaign_planning", transitionMode: "inline_materialize", confidence: "high", summary: "Campaign planning is ready to materialize in the operator canvas.", recommendedRouteFallback: "/shopreel/create", ...context });
  }

  return buildResolution({ rawCommand: input.rawCommand, interpretedIntent, state: "interpreting_intent", surfaceId: "idle_command", transitionMode: "route_fallback", confidence: "low", summary: "Intent interpretation is in progress; full workspace route remains available.", recommendedRouteFallback: "/shopreel/campaigns", ...context });
}
