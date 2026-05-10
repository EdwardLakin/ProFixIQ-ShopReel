"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildCampaignWorkflowDescriptor, campaignWorkflowProgress } from "@/features/shopreel/campaigns/lib/campaignWorkflow";
import { readWorkspaceMemory, writeWorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { buildRecoveryInbox } from "@/features/shopreel/ui/system/recoveryInbox";

const labels = {
  idea: "Idea",
  selection: "Selection",
  editing: "Editing",
  generation: "Generation",
  review: "Review",
  publish_prep: "Publish prep",
} as const;

export default function CampaignWorkflowContinuityRail({ campaignId, generationId }: { campaignId?: string; generationId?: string }) {
  const pathname = usePathname();
  const descriptor = useMemo(() => {
    const memory = readWorkspaceMemory();
    return buildCampaignWorkflowDescriptor({
      route: pathname,
      campaignId,
      generationId,
      previous: memory?.campaignWorkflowDescriptor ?? null,
      resumeRoute: pathname,
    });
  }, [pathname, campaignId, generationId]);

  useEffect(() => {
    const memory = readWorkspaceMemory();
    if (!memory) return;
    writeWorkspaceMemory({
      ...memory,
      lastCampaignId: campaignId ?? memory.lastCampaignId,
      lastGenerationId: generationId ?? memory.lastGenerationId,
      campaignWorkflowDescriptor: descriptor,
      recoveryInbox: buildRecoveryInbox({
        route: pathname,
        generationId: generationId ?? memory.lastGenerationId,
        campaignId: campaignId ?? memory.lastCampaignId,
        interrupted: Boolean(memory.interruptedWorkflow),
        hasReviewItems: descriptor.stage === "review" || descriptor.stage === "generation",
        hasPublishReady: descriptor.stage === "publish_prep",
        hasPublishFailures: false,
        hasDraftContinuity: descriptor.stage === "editing" || descriptor.stage === "selection",
      }),
      updatedAt: new Date().toISOString(),
    });
  }, [descriptor, campaignId, generationId]);

  const progress = campaignWorkflowProgress(descriptor.stage);
  return (
    <section className="rounded-2xl border border-cyan-300/25 bg-cyan-500/[0.06] p-3 text-xs text-cyan-50">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-cyan-200/25 px-2 py-0.5">Campaign workflow</span>
        <span>Stage {progress}/6 · {labels[descriptor.stage]}</span>
        <span>Next: {descriptor.nextStage ? labels[descriptor.nextStage] : "Complete"}</span>
        <Link href={descriptor.resumeRoute} className="ml-auto rounded-full border border-white/20 px-2 py-0.5 hover:bg-white/10">Resume context</Link>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300" style={{ width: `${(progress / 6) * 100}%` }} /></div>
    </section>
  );
}
