import { ShopReelSurface } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import InternalGrowthAgentPanel from "@/features/internal-growth/components/InternalGrowthAgentPanel";

export default function GrowthAgentPage() {
  if (process.env.SHOPREEL_INTERNAL_GROWTH_AGENT_ENABLED !== "true") {
    return <GlassShell title="Growth Agent"><ShopReelSurface title="Internal Growth Agent">Feature is disabled by SHOPREEL_INTERNAL_GROWTH_AGENT_ENABLED.</ShopReelSurface></GlassShell>;
  }
  return <GlassShell title="Growth Agent"><ShopReelSurface title="Internal Growth Agent (Owner/Developer)"><InternalGrowthAgentPanel /></ShopReelSurface></GlassShell>;
}
