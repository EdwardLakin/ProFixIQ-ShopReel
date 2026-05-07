import type { Json } from "@/types/supabase";

export type ShopReelAgentType = "content_strategist" | "script_storyboard" | "editor" | "render" | "publish" | "analytics";
export type ShopReelAgentRunStatus = "planned" | "approved" | "rejected" | "archived";
export type ShopReelAgentTaskType = "create_content_idea" | "draft_script" | "draft_storyboard" | "suggest_edit" | "suggest_render" | "suggest_publish" | "analyze_performance";
export type ShopReelAgentTaskStatus = "proposed" | "approved" | "rejected" | "canceled";
export type ShopReelAgentTaskPriority = "low" | "medium" | "high";

export type ShopReelAgentRun = { id: string; shop_id: string; campaign_id: string | null; agent_type: ShopReelAgentType; status: ShopReelAgentRunStatus; input_snapshot: Json; output: Json; trace: Json; confidence: number | null; requires_approval: boolean; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string; };
export type ShopReelAgentTask = { id: string; run_id: string; shop_id: string; campaign_id: string | null; generation_id: string | null; render_job_id: string | null; publication_id: string | null; agent_type: ShopReelAgentType; task_type: ShopReelAgentTaskType; status: ShopReelAgentTaskStatus; priority: ShopReelAgentTaskPriority; title: string; details: string | null; input_snapshot: Json; output: Json; trace: Json; confidence: number | null; requires_approval: boolean; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string; };

export type AgentPlanSummary = { run: ShopReelAgentRun; tasks: ShopReelAgentTask[]; summary: { proposedCount: number; requiresApprovalCount: number; averageConfidence: number | null; }; };


export type ShopReelAgentTaskApprovalAction = "approved" | "rejected" | "canceled" | "commented";

export type ShopReelAgentTaskApprovalEvent = {
  id: string;
  shop_id: string;
  task_id: string;
  run_id: string | null;
  campaign_id: string | null;
  action: ShopReelAgentTaskApprovalAction;
  reason: string | null;
  metadata: Json;
  created_by: string | null;
  created_at: string;
};

export type ShopReelAgentExecutionType = "story_generation" | "render_preparation" | "publish_preparation" | "analytics_snapshot";
export type ShopReelAgentExecutionStatus = "pending" | "prepared" | "blocked" | "canceled" | "failed";

export type ShopReelAgentExecution = {
  id: string;
  shop_id: string;
  task_id: string;
  run_id: string | null;
  campaign_id: string | null;
  execution_type: ShopReelAgentExecutionType;
  status: ShopReelAgentExecutionStatus;
  generation_id: string | null;
  render_job_id: string | null;
  publication_id: string | null;
  input_snapshot: Json;
  output: Json;
  trace: Json;
  error_message: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};
