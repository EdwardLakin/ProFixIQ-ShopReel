import OpenAI from "openai";

type WorkOrderInput = {
  id: string;
  customId?: string | null;
  shopId: string;
  customerName?: string | null;
  vehicle?: {
    year?: number | null;
    make?: string | null;
    model?: string | null;
    vin?: string | null;
  } | null;
  concern?: string | null;
  findings?: string[];
  recommendedWork?: string[];
  completedWork?: string[];
};

type TemplateRecord = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  default_hook: string | null;
  default_cta: string | null;
  script_guidance: string | null;
  visual_guidance: string | null;
};

export type GeneratedVideoConcept = {
  title: string;
  contentType:
    | "workflow_demo"
    | "repair_story"
    | "inspection_highlight"
    | "before_after"
    | "educational_tip"
    | "how_to"
    | "findings_on_vehicle";
  hook: string;
  caption: string;
  cta: string;
  scriptText: string;
  voiceoverText: string;
  shotList: string[];
  platformTargets: string[];
  generationNotes: string;
  aiScore: number;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function buildWorkOrderSummary(input: WorkOrderInput): string {
  const vehicleLabel = [
    input.vehicle?.year,
    input.vehicle?.make,
    input.vehicle?.model,
  ]
    .filter(Boolean)
    .join(" ");

  return [
    `Work order ID: ${input.customId ?? input.id}`,
    `Vehicle: ${vehicleLabel || "Unknown vehicle"}`,
    `Customer: ${input.customerName ?? "Unknown customer"}`,
    `Concern: ${input.concern ?? "No concern provided"}`,
    `Findings: ${(input.findings ?? []).join("; ") || "None"}`,
    `Recommended work: ${(input.recommendedWork ?? []).join("; ") || "None"}`,
    `Completed work: ${(input.completedWork ?? []).join("; ") || "None"}`,
  ].join("\n");
}

export async function generateVideoConcept(args: {
  workOrder: WorkOrderInput;
  template: TemplateRecord;
  topPerformingTypes?: Array<{
    content_type: string;
    avg_engagement_score: number | null;
    total_views: number | null;
    total_leads: number | null;
  }>;
}): Promise<GeneratedVideoConcept> {
  const { workOrder, template, topPerformingTypes = [] } = args;

  const prompt = `
You are creating a high-performing short-form marketing video concept for an automotive repair shop.

Goals:
- Make the video feel real, practical, and trustworthy.
- Show process clarity, findings, repair value, and professionalism.
- Avoid hype, fake claims, or cheesy marketing language.
- Write for short-form content that could work on Instagram, Facebook, TikTok, and YouTube Shorts.

Selected template:
Key: ${template.key}
Name: ${template.name}
Description: ${template.description ?? ""}
Default hook: ${template.default_hook ?? ""}
Default CTA: ${template.default_cta ?? ""}
Script guidance: ${template.script_guidance ?? ""}
Visual guidance: ${template.visual_guidance ?? ""}

Recent learning signals:
${JSON.stringify(topPerformingTypes, null, 2)}

Work order:
${buildWorkOrderSummary(workOrder)}

Return strict JSON with this shape:
{
  "title": "string",
  "contentType": "workflow_demo | repair_story | inspection_highlight | before_after | educational_tip | how_to | findings_on_vehicle",
  "hook": "string",
  "caption": "string",
  "cta": "string",
  "scriptText": "string",
  "voiceoverText": "string",
  "shotList": ["string"],
  "platformTargets": ["instagram", "facebook", "tiktok", "youtube"],
  "generationNotes": "string",
  "aiScore": 0
}
`;

  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  const text = response.output_text;
  const parsed = JSON.parse(text) as GeneratedVideoConcept;

  return parsed;
}