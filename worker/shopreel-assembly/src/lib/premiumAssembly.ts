import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";
import {
  buildCampaignVoiceoverScript,
  generateCampaignVoiceoverAudio,
} from "./voiceover.js";

const execFileAsync = promisify(execFile);

function getFfmpegBinary(): string {
  const fromEnv = process.env.FFMPEG_PATH?.trim();
  if (fromEnv) return fromEnv;
  if (ffmpegPath) return ffmpegPath;
  return "ffmpeg";
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
  const ffmpeg = getFfmpegBinary();

  const stitchedVideo = path.join(
    input.workDir,
    `${input.outputBaseName}.stitched.mp4`
  );
  const finalVideo = path.join(
    input.workDir,
    `${input.outputBaseName}.final.mp4`
  );

  if (input.scenes.length === 0) {
    throw new Error("No scenes available for premium assembly");
  }

  const stitchArgs = [
    "-y",
    ...input.scenes.flatMap((scene) => ["-i", scene.localVideoPath]),
    "-filter_complex",
    `concat=n=${input.scenes.length}:v=1:a=0[v]`,
    "-map",
    "[v]",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    stitchedVideo,
  ];

  await execFileAsync(ffmpeg, stitchArgs);

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

  await execFileAsync(ffmpeg, [
    "-y",
    "-i",
    stitchedVideo,
    "-i",
    voice.filePath,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
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
