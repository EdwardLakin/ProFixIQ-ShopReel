import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import OperatorDashboard from "@/features/shopreel/operator/components/OperatorDashboard";
import { getOperatorDashboardData } from "@/features/shopreel/automation/lib/server";

export default async function ShopReelOperatorPage() {
  const data = await getOperatorDashboardData();

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Operator Dashboard"
      subtitle="Monitor queued jobs, processing jobs, active campaigns, learnings, and automation health."
    >
      <ShopReelNav />
      <OperatorDashboard {...data} />
    </GlassShell>
  );
}
