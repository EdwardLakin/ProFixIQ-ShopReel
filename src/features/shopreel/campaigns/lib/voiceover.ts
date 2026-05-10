import { SHOPREEL_AI_MODELS } from "@/features/shopreel/ai/modelConfig";
import { getOpenAIClient } from "@/features/ai/server/openai";
import fs from "node:fs/promises";
import path from "node:path";

export async function buildCampaignVoiceoverScript(input: {
  campaignTitle: string;
  angle: string;
  audience?: string | null;
  offer?: string | null;
  goal?: string | null;
  scenes: Array<{ title: string; prompt: string }>;
}) {
  const prompt = `
Write one continuous 20-30 second marketing voiceover script.
Keep it natural and persuasive.
Structure:
- hook
- problem
- solution
- outcome
- CTA

Campaign title: ${input.campaignTitle}
Angle: ${input.angle}
Audience: ${input.audience ?? ""}
Offer: ${input.offer ?? ""}
Goal: ${input.goal ?? ""}

Scenes:
${input.scenes.map((s, i) => `${i + 1}. ${s.title}: ${s.prompt}`).join("\n")}
`.trim();

  const response = await getOpenAIClient().responses.create({
    model: SHOPREEL_AI_MODELS.text,
    input: prompt,
  });

  return response.output_text.trim();
}

export async function generateCampaignVoiceoverAudio(input: {
  script: string;
  outputDir: string;
  fileBase: string;
}) {
  const audio = await getOpenAIClient().audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "alloy",
    input: input.script,
  });

  const bytes = Buffer.from(await audio.arrayBuffer());
  await fs.mkdir(input.outputDir, { recursive: true });

  const filePath = path.join(input.outputDir, `${input.fileBase}.mp3`);
  await fs.writeFile(filePath, bytes);

  return { filePath };
}
