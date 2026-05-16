export type CampaignMode =
  | "business_advertising"
  | "launch_campaign"
  | "weekly_content"
  | "uploaded_asset"
  | "campaign_refine"
  | "publish_learning"
  | "internal_self_marketing"
  | "general_campaign";

export type ParsedCampaignBrief = {
  mode: CampaignMode;
  confidence: number;
  sourcePrompt: string;
  businessName: string | null;
  productName: string | null;
  businessType: string | null;
  location: string | null;
  audience: string | null;
  goal: string | null;
  offer: string | null;
  platformFocus: string[];
  tone: string | null;
  painPoints: string[];
  proofPoints: string[];
  desiredOutputs: string[];
  missingQuestions: string[];
  notes: string[];
};
