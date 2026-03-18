import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import AutomationRunner from "@/features/shopreel/automation/components/AutomationRunner";

export default function ShopReelAutomationPage() {
  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Automation"
      subtitle="Run the media sync, campaign analytics, and learning loop from one place."
    >
      <ShopReelNav />
      <AutomationRunner />
    </GlassShell>
  );
}
