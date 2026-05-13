import type { OperatorCapability } from "@/features/shopreel/ui/system/operatorCapabilities";
import type { OperatorMemoryAggregate } from "@/features/shopreel/operator-memory/aggregation";
import type { WorkspaceTimelineAggregate } from "@/features/shopreel/workspace-timeline/models";

export type OperatorWorkflowStatus = "active" | "blocked" | "ready" | "stale" | "completed" | "failed";

export type OperatorWorkflowDependency = {
  key: string;
  label: string;
  resolved: boolean;
  reason?: string;
};

export type OperatorBlocker = {
  key: string;
  stage: OperatorWorkflowStageName;
  message: string;
  severity: "low" | "medium" | "high";
};

export type OperatorWorkflowStageName =
  | "intake"
  | "planning"
  | "generation"
  | "review"
  | "revision"
  | "render"
  | "approval"
  | "publish"
  | "analytics"
  | "recovery";

export type OperatorWorkflowStep = {
  key: string;
  stage: OperatorWorkflowStageName;
  status: OperatorWorkflowStatus;
  dependencies: OperatorWorkflowDependency[];
};

export type OperatorWorkflow = {
  id: string;
  capability: OperatorCapability;
  status: OperatorWorkflowStatus;
  activeStage: OperatorWorkflowStageName;
  steps: OperatorWorkflowStep[];
  lastUpdatedAt: string | null;
};

export type OperatorSuggestedAction = {
  key: string;
  label: string;
  capability: OperatorCapability;
  stage: OperatorWorkflowStageName;
  reason: string;
};

export type OperatorRecoveryPlan = {
  workflowId: string;
  resumeStage: OperatorWorkflowStageName;
  routeHint: string;
  reason: string;
};

export type OperatorIntentSnapshot = {
  inferredIntent: OperatorCapability;
  stage: OperatorWorkflowStageName;
  unresolvedBlockers: number;
  nextActionKeys: string[];
};

export type OperatorOrchestrationPlan = {
  workflows: OperatorWorkflow[];
  activeWorkflow: OperatorWorkflow | null;
  blockers: OperatorBlocker[];
  suggestedActions: OperatorSuggestedAction[];
  recoveryPlans: OperatorRecoveryPlan[];
  intentSnapshot: OperatorIntentSnapshot;
  summary: {
    currentOperationalFocus: string;
    blockedCount: number;
    readyActions: number;
    pendingApprovals: number;
    failedRenders: number;
    publishReadyWork: number;
    staleWorkflows: number;
  };
};

export function deriveOperatorOrchestrationPlan(input: {
  memory: OperatorMemoryAggregate;
  timeline: WorkspaceTimelineAggregate;
  fallbackCapability?: OperatorCapability;
}): OperatorOrchestrationPlan {
  const steps = buildSteps(input.memory, input.timeline);
  const workflows: OperatorWorkflow[] = [
    buildWorkflow("content-lifecycle", input.fallbackCapability ?? "content_generation", steps, input.timeline),
  ];

  const blockers = workflows.flatMap((workflow) =>
    workflow.steps
      .filter((step) => step.status === "blocked" || step.dependencies.some((dep) => !dep.resolved))
      .map<OperatorBlocker>((step) => ({
        key: `${workflow.id}:${step.key}`,
        stage: step.stage,
        message: unresolvedReason(step),
        severity: step.stage === "publish" || step.stage === "render" ? "high" : "medium",
      })),
  );

  const suggestedActions = workflows
    .flatMap((workflow) => workflow.steps.filter((step) => step.status === "ready").map((step) => ({ workflow, step })))
    .slice(0, 5)
    .map<OperatorSuggestedAction>(({ workflow, step }) => ({
      key: `${workflow.id}:${step.key}:continue`,
      label: `Continue ${step.stage}`,
      capability: workflow.capability,
      stage: step.stage,
      reason: `Workflow ${workflow.id} is ready to advance ${step.stage}.`,
    }));

  const recoveryPlans = workflows
    .filter((workflow) => workflow.status === "failed" || workflow.status === "blocked" || workflow.status === "stale")
    .map<OperatorRecoveryPlan>((workflow) => ({
      workflowId: workflow.id,
      resumeStage: workflow.activeStage,
      routeHint: "/shopreel/operations",
      reason: `Recover ${workflow.id} from ${workflow.activeStage}.`,
    }));

  const activeWorkflow = workflows[0] ?? null;
  const failedRenders = countStageStatus(workflows, "render", "failed");
  const publishReadyWork = countStageStatus(workflows, "publish", "ready");
  const staleWorkflows = workflows.filter((workflow) => workflow.status === "stale").length;

  return {
    workflows,
    activeWorkflow,
    blockers,
    suggestedActions,
    recoveryPlans,
    intentSnapshot: {
      inferredIntent: activeWorkflow?.capability ?? input.fallbackCapability ?? "workspace_recovery",
      stage: activeWorkflow?.activeStage ?? "recovery",
      unresolvedBlockers: blockers.length,
      nextActionKeys: suggestedActions.map((action) => action.key),
    },
    summary: {
      currentOperationalFocus: activeWorkflow ? `${activeWorkflow.capability}:${activeWorkflow.activeStage}` : "workspace_recovery:recovery",
      blockedCount: blockers.length,
      readyActions: suggestedActions.length,
      pendingApprovals: input.memory.unresolvedApprovals.length,
      failedRenders,
      publishReadyWork,
      staleWorkflows,
    },
  };
}

function buildSteps(memory: OperatorMemoryAggregate, timeline: WorkspaceTimelineAggregate): OperatorWorkflowStep[] {
  const hasUploads = memory.recentUploads.length > 0;
  const hasDrafts = memory.unfinishedDrafts.length > 0;
  const hasApprovals = memory.unresolvedApprovals.length > 0;
  const hasRenders = memory.pendingRenders.length > 0;
  const hasStalled = memory.stalledEntities.length > 0;
  const hasOpportunities = timeline.recentWorkspaceActivity.some((event) => event.entityKind === "opportunity");
  const hasPublishScheduled = timeline.recentWorkspaceActivity.some((event) => event.eventType === "publish_scheduled");
  const hasRenderFailures = timeline.recentWorkspaceActivity.some((event) => event.eventType === "render_started" && event.unresolved);

  return [
    step("intake", hasUploads || hasOpportunities ? "completed" : "ready", []),
    step("planning", hasOpportunities && !hasDrafts ? "ready" : "completed", [dependency("intake", hasUploads || hasOpportunities, "Need uploads or opportunities")]),
    step("generation", hasDrafts ? "ready" : "completed", [dependency("planning", true)]),
    step("review", hasApprovals ? "ready" : "completed", [dependency("generation", true)]),
    step("revision", hasStalled ? "blocked" : "completed", [dependency("review", !hasApprovals, "Pending approvals unresolved")]),
    step("render", hasRenderFailures ? "failed" : hasRenders ? "ready" : "completed", [dependency("revision", !hasStalled, "Revision blockers remain")]),
    step("approval", hasApprovals ? "blocked" : "ready", [dependency("render", !hasRenderFailures, "Render failures unresolved")]),
    step("publish", hasPublishScheduled ? "ready" : "blocked", [dependency("approval", !hasApprovals, "Requires approvals")]),
    step("analytics", hasPublishScheduled ? "ready" : "blocked", [dependency("publish", hasPublishScheduled, "No publish activity detected")]),
    step("recovery", hasStalled || hasRenderFailures ? "ready" : "completed", []),
  ];
}

function buildWorkflow(id: string, capability: OperatorCapability, steps: OperatorWorkflowStep[], timeline: WorkspaceTimelineAggregate): OperatorWorkflow {
  const activeStep = steps.find((s) => s.status === "ready" || s.status === "blocked" || s.status === "failed") ?? steps[0];
  const status = activeStep.status === "failed" ? "failed" : activeStep.status === "blocked" ? "blocked" : steps.some((s) => s.status === "ready") ? "active" : "completed";
  return {
    id,
    capability,
    status,
    activeStage: activeStep.stage,
    steps,
    lastUpdatedAt: timeline.recentWorkspaceActivity[0]?.createdAt ?? null,
  };
}

function step(stage: OperatorWorkflowStageName, status: OperatorWorkflowStatus, dependencies: OperatorWorkflowDependency[]): OperatorWorkflowStep {
  return { key: stage, stage, status, dependencies };
}

function dependency(key: string, resolved: boolean, reason?: string): OperatorWorkflowDependency {
  return { key, label: key, resolved, reason };
}

function unresolvedReason(step: OperatorWorkflowStep): string {
  const unresolved = step.dependencies.filter((dep) => !dep.resolved).map((dep) => dep.reason ?? dep.label);
  if (step.status === "failed") return `Stage ${step.stage} failed and needs retry.`;
  if (unresolved.length) return unresolved.join("; ");
  return `Stage ${step.stage} is blocked.`;
}

function countStageStatus(workflows: OperatorWorkflow[], stage: OperatorWorkflowStageName, status: OperatorWorkflowStatus): number {
  return workflows.reduce((count, workflow) => count + workflow.steps.filter((step) => step.stage === stage && step.status === status).length, 0);
}
