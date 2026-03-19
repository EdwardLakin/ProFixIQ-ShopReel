import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { buildCampaignVoiceoverScript, generateCampaignVoiceoverAudio } from "./voiceover";

const execFileAsync = promisify(execFile);

async function writeConcatFile(videoPaths: string[], workDir: string) {
  const concatPath = path.join(workDir, "concat.txt");
  const body = videoPaths.map((p) => `file '${p.replaceAll("'", "'\\''")}'`).join("\n");
  await fs.writeFile(concatPath, body, "utf8");
  return concatPath;
}

export async function assemblePremiumCampaignItem(input: {
  workDir: string;
  campaignTitle: string;
  angle: string;
  audience?: string | null;
  offer?: string | null;
  goal?: string | null;
  scenes: Array<{
    title: string;
    prompt: string;
    localVideoPath: string;
  }>;
  outputBaseName: string;
}) {
  await fs.mkdir(input.workDir, { recursive: true });

  const stitchedVideo = path.join(input.workDir, `${input.outputBaseName}.stitched.mp4`);
  const finalVideo = path.join(input.workDir, `${input.outputBaseName}.final.mp4`);

  const concatFile = await writeConcatFile(
    input.scenes.map((s) => s.localVideoPath),
    input.workDir
  );

  await execFileAsync("ffmpeg", [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", concatFile,
    "-c", "copy",
    stitchedVideo,
  ]);

  const script = await buildCampaignVoiceoverScript({
    campaignTitle: input.campaignTitle,
    angle: input.angle,
    audience: input.audience,
    offer: input.offer,
    goal: input.goal,
    scenes: input.scenes.map((s) => ({ title: s.title, prompt: s.prompt })),
  });

  const voice = await generateCampaignVoiceoverAudio({
    script,
    outputDir: input.workDir,
    fileBase: `${input.outputBaseName}.voice`,
  });

  await execFileAsync("ffmpeg", [
    "-y",
    "-i", stitchedVideo,
    "-i", voice.filePath,
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-c:v", "copy",
    "-c:a", "aac",
    "-shortest",
    finalVideo,
  ]);

  return {
    script,
    stitchedVideo,
    voiceoverPath: voice.filePath,
    finalVideo,
  };
}
