import type { OperatorWorldCard } from "@/features/shopreel/operator/operatorWorlds";
import { classifyCommandInputIntent } from "@/features/shopreel/ui/system/commandInputIntent";
import { createCampaignCommandHandoff } from "@/features/shopreel/ui/system/campaignCommandHandoff";
import {
  operatorCapabilityRegistry,
  resolveCapabilityForWorld,
  type OperatorAction,
  type OperatorActionKind,
  type OperatorActionResult,
} from "@/features/shopreel/ui/system/operatorCapabilities";
import { resolveRouteFromPrompt } from "@/features/shopreel/ui/system/shopReelRouteRegistry";

export type CommandSource = "home_command" | "global_command";

export type ExecuteShopReelCommandResult = {
  decision: ReturnType<typeof resolveRouteFromPrompt>;
  selectedRoute: string;
  handoffMethod: "none" | "session_storage";
  handoffId: string | null;
  commandIntent: ReturnType<typeof classifyCommandInputIntent>;
  typedAction: OperatorAction | null;
  actionResult: OperatorActionResult | null;
};

function detectActionKind(command: string): OperatorActionKind | null {
  const prompt = command.toLowerCase();
  if (/(continue latest|continue active|continue)/.test(prompt)) return "continue_latest";
  if (/(review approvals|review|approve)/.test(prompt)) return "review";
  if (/(retry render|retry)/.test(prompt)) return "retry";
  if (/(schedule this|schedule|publish)/.test(prompt)) return "schedule";
  if (/(open latest upload|upload)/.test(prompt)) return "open";
  if (/(analyze performance|analytics|analyze)/.test(prompt)) return "analyze";
  return null;
}

export function executeShopReelCommand(input: {
  command: string;
  lastRoute?: string;
  source: CommandSource;
  recentWorlds?: OperatorWorldCard[];
}): ExecuteShopReelCommandResult {
  const decision = resolveRouteFromPrompt(input.command, input.lastRoute);
  const commandIntent = classifyCommandInputIntent(input.command);
  let selectedRoute = decision.route;
  let handoffMethod: "none" | "session_storage" = "none";
  let handoffId: string | null = null;
  let typedAction: OperatorAction | null = null;
  let actionResult: OperatorActionResult | null = null;

  const actionKind = detectActionKind(input.command);
  const headWorld = input.recentWorlds?.[0];
  if (actionKind && headWorld) {
    const capability = resolveCapabilityForWorld(headWorld);
    const def = operatorCapabilityRegistry[capability];
    const allowed = def.allowedActions.includes(actionKind);
    const route = allowed ? headWorld.href : def.fallbackRoute;
    selectedRoute = route;
    typedAction = { kind: actionKind, label: actionKind.replaceAll("_", " "), target: { entityKind: headWorld.kind, entityId: headWorld.id, href: route, capability } };
    actionResult = { ok: allowed, route, reason: allowed ? `Routed to ${def.displayLabel}.` : `Action not allowed for ${def.displayLabel}; fallback applied.` };
  }

  if (commandIntent === "create_campaign") {
    const handoff = createCampaignCommandHandoff({ prompt: input.command.trim(), source: input.source });
    selectedRoute = `/shopreel/campaigns/new?mode=create&handoff=${encodeURIComponent(handoff.id)}`;
    handoffMethod = "session_storage";
    handoffId = handoff.id;
  }

  return { decision, selectedRoute, handoffMethod, handoffId, commandIntent, typedAction, actionResult };
}


export function traceShopReelCommandExecution(input: {
  source: CommandSource;
  prompt: string;
  detectedIntent: string;
  selectedRoute: string;
  handoffMethod: "none" | "session_storage";
  handoffId: string | null;
  staleContinuityIgnored: boolean;
  reason: string;
}) {
  console.info("[ShopReelRouteTrace]", {
    source: input.source,
    promptLength: input.prompt.length,
    detectedIntent: input.detectedIntent,
    handoffMethod: input.handoffMethod,
    handoffId: input.handoffId,
    selectedRoute: input.selectedRoute,
    staleContinuityIgnored: input.staleContinuityIgnored,
    reason: input.reason,
  });
}
