import path from "node:path";
import { writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";
import {
  buildCampaignVoiceoverScript,
  generateCampaignVoiceoverAudio,
} from "./voiceover";

const execFileAsync = promisify(execFile);

function getFfmpegBinary(): string {
  const fromEnv = process.env.FFMPEG_PATH?.trim();
  if (fromEnv) return fromEnv;
  if (ffmpegPath) return ffmpegPath;
  return "ffmpeg";
}

const FFMPEG_EXEC_OPTIONS = {
  maxBuffer: 1024 * 1024 * 20,
};

function escapeConcatPath(filePath: string) {
  return filePath.replace(/'/g, "'\\''");
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
  const concatListPath = path.join(
    input.workDir,
    `${input.outputBaseName}.concat.txt`
  );

  if (input.scenes.length === 0) {
    throw new Error("No scenes available for premium assembly");
  }

  const concatList = input.scenes
    .map((scene) => `file '${escapeConcatPath(scene.localVideoPath)}'`)
    .join("\n");

  await writeFile(concatListPath, concatList, "utf8");

  await execFileAsync(
    ffmpeg,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatListPath,
      "-map",
      "0:v:0",
      "-c:v",
      "copy",
      "-an",
      stitchedVideo,
    ],
    FFMPEG_EXEC_OPTIONS
  );

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

  await execFileAsync(
    ffmpeg,
    [
      "-hide_banner",
      "-loglevel",
      "error",
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
    ],
    FFMPEG_EXEC_OPTIONS
  );

  return {
    script,
    stitchedVideo,
    voiceoverPath: voice.filePath,
    finalVideo,
  };
}
