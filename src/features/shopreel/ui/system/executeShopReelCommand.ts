import { classifyCommandInputIntent } from "@/features/shopreel/ui/system/commandInputIntent";
import { createCampaignCommandHandoff } from "@/features/shopreel/ui/system/campaignCommandHandoff";
import { resolveRouteFromPrompt } from "@/features/shopreel/ui/system/shopReelRouteRegistry";

export type CommandSource = "home_command" | "global_command";

export type ExecuteShopReelCommandResult = {
  decision: ReturnType<typeof resolveRouteFromPrompt>;
  selectedRoute: string;
  handoffMethod: "none" | "session_storage";
  handoffId: string | null;
  commandIntent: ReturnType<typeof classifyCommandInputIntent>;
};

export function executeShopReelCommand(input: {
  command: string;
  lastRoute?: string;
  source: CommandSource;
}): ExecuteShopReelCommandResult {
  const decision = resolveRouteFromPrompt(input.command, input.lastRoute);
  const commandIntent = classifyCommandInputIntent(input.command);
  let selectedRoute = decision.route;
  let handoffMethod: "none" | "session_storage" = "none";
  let handoffId: string | null = null;

  if (commandIntent === "create_campaign") {
    const handoff = createCampaignCommandHandoff({ prompt: input.command.trim(), source: input.source });
    selectedRoute = `/shopreel/campaigns/new?mode=create&handoff=${encodeURIComponent(handoff.id)}`;
    handoffMethod = "session_storage";
    handoffId = handoff.id;
  }

  return { decision, selectedRoute, handoffMethod, handoffId, commandIntent };
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
