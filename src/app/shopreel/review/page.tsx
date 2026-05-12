export const dynamic = "force-dynamic";

import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import EcosystemStateRail from "@/features/shopreel/ui/system/EcosystemStateRail";
import RecoveryInboxRail from "@/features/shopreel/ui/system/RecoveryInboxRail";
import { createAdminClient } from "@/lib/supabase/server";
import ReviewInboxClient from "@/features/shopreel/review/components/ReviewInboxClient";

type AgentRun = { id: string; campaign_id: string | null; agent_type: string; status: string; updated_at: string; confidence: number | null };
type AgentTask = { id: string; title: string; details: string | null; status: string; confidence: number | null; requires_approval: boolean; campaign_id: string | null; run_id: string | null; updated_at: string };

type CampaignLite = { id: string; title: string };

export default async function ShopReelReviewInboxPage() {
  const supabase = createAdminClient();
  const [{ data: runs }, { data: campaigns }] = await Promise.all([
    supabase.from("shopreel_agent_runs").select("id, campaign_id, agent_type, status, updated_at, confidence").order("updated_at", { ascending: false }).limit(24),
    supabase.from("shopreel_campaigns").select("id, title").order("updated_at", { ascending: false }).limit(60),
  ]);

  const runIds = (runs ?? []).map((run) => run.id);
  const { data: tasks } = runIds.length
    ? await supabase.from("shopreel_agent_tasks").select("id, title, details, status, confidence, requires_approval, campaign_id, run_id, updated_at").in("run_id", runIds).order("updated_at", { ascending: false }).limit(120)
    : { data: [] as AgentTask[] };

  const campaignMap = new Map((campaigns ?? []).map((campaign: CampaignLite) => [campaign.id, campaign.title]));
  const runMap = new Map((runs ?? []).map((run: AgentRun) => [run.id, run]));
  const items = (tasks ?? []).map((task: AgentTask) => {
    const run = task.run_id ? runMap.get(task.run_id) : undefined;
    const isPendingDecision = task.status === "proposed" && task.requires_approval;
    const isBlocked = run?.status === "blocked" || task.status === "blocked";
    const isHistory = ["approved", "rejected", "executed", "cancelled"].includes(task.status);
    const campaignId = task.campaign_id ?? run?.campaign_id ?? null;

    const priority: "high_priority" | "active_proposal" | "history" = isHistory ? "history" : isBlocked || isPendingDecision ? "high_priority" : "active_proposal";

    return {
      id: task.id,
      campaignId,
      campaignTitle: campaignId ? campaignMap.get(campaignId) ?? "Campaign" : "Campaign context unavailable",
      decisionTitle: task.title || "AI decision ready",
      aiSummary: task.details ?? "The AI completed work and is waiting for your direction.",
      decisionNeeded: isPendingDecision ? "Approve, reject, or request changes." : "Review prior decision context.",
      whyItMatters: isBlocked ? "This is blocking campaign momentum." : "Your input guides the AI's next execution step.",
      nextStep: "After approval, the AI continues execution and updates the campaign workspace.",
      confidence: task.confidence,
      priority,
      status: task.status,
      workspaceHref: campaignId ? `/shopreel/campaigns/${campaignId}?panel=review` : "/shopreel/campaigns",
    };
  });

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Review Inbox"
      subtitle="AI is progressing campaigns and bringing you the decisions that move work forward."
    >
      <EcosystemStateRail surface="review" />
      <RecoveryInboxRail />
      <ReviewInboxClient items={items} />
    </GlassShell>
  );
}
