import type { Json } from "@/types/supabase";

export type BrainStatus = "active" | "archived";

export type BrandBrainProfile = {
  id: string;
  shop_id: string;
  status: BrainStatus;
  positioning: string | null;
  brand_voice_rules: string | null;
  prohibited_claims: string[];
  preferred_ctas: string[];
  visual_style_notes: string | null;
  audience_notes: string | null;
  metadata: Json;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignBrain = {
  id: string;
  shop_id: string;
  campaign_id: string;
  status: BrainStatus;
  campaign_objective: string | null;
  target_audience: string | null;
  channel_priorities: string[];
  content_pillars: string[];
  experiment_hypotheses: string[];
  success_signals: string[];
  metadata: Json;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};
