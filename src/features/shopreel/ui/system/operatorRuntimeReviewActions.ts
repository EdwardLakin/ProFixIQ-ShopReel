export type RuntimeReviewActionError = {
  message: string;
  status: number;
  retryable: boolean;
};

export type RuntimeReviewDecisionResult = {
  ok: true;
  task: { id: string; status: string };
  event: { action: string; reason: string | null; created_at?: string | null };
};

type RuntimeReviewDecisionInput = {
  taskId: string;
  reason?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

async function postRuntimeReviewDecision(
  taskId: string,
  endpointAction: "approve" | "reject",
  payload: { reason: string | null; metadata: Record<string, string | number | boolean | null> },
): Promise<RuntimeReviewDecisionResult> {
  const response = await fetch(`/api/shopreel/agents/tasks/${taskId}/${endpointAction}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => null)) as
    | { ok?: boolean; error?: string; task?: RuntimeReviewDecisionResult["task"]; event?: RuntimeReviewDecisionResult["event"] }
    | null;

  if (!response.ok || body?.ok === false || !body?.task || !body?.event) {
    const error: RuntimeReviewActionError = {
      message: body?.error ?? "Unable to save review decision.",
      status: response.status,
      retryable: response.status >= 500 || response.status === 0,
    };
    throw error;
  }

  return { ok: true, task: body.task, event: body.event };
}

export async function approveRuntimeReviewDecision(input: RuntimeReviewDecisionInput): Promise<RuntimeReviewDecisionResult> {
  return postRuntimeReviewDecision(input.taskId, "approve", {
    reason: input.reason?.trim() || null,
    metadata: {
      source: "operator_runtime_canvas",
      decisionMode: "approve",
      ...(input.metadata ?? {}),
    },
  });
}

export async function rejectRuntimeReviewDecision(input: RuntimeReviewDecisionInput): Promise<RuntimeReviewDecisionResult> {
  return postRuntimeReviewDecision(input.taskId, "reject", {
    reason: input.reason?.trim() || null,
    metadata: {
      source: "operator_runtime_canvas",
      decisionMode: "reject",
      ...(input.metadata ?? {}),
    },
  });
}

export async function requestRuntimeReviewChanges(input: RuntimeReviewDecisionInput): Promise<RuntimeReviewDecisionResult> {
  return postRuntimeReviewDecision(input.taskId, "reject", {
    reason: input.reason?.trim() || "Refinement requested from runtime inline review.",
    metadata: {
      source: "operator_runtime_canvas",
      decisionMode: "refine",
      refinementSignal: input.reason?.trim() || "runtime_refine_request",
      ...(input.metadata ?? {}),
    },
  });
}
