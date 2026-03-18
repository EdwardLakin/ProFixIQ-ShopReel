import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

type ComposeCtaArgs = {
  inputVideoPath: string;
  outputVideoPath: string;
  workDir: string;
  title?: string | null;
  subtitle?: string | null;
  ctaLabel?: string | null;
  brandLabel?: string | null;
  durationSeconds?: number;
  width?: number;
  height?: number;
};

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code ?? "unknown"}`));
    });
    child.on("error", reject);
  });
}

function escapeDrawtext(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/,/g, "\\,")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}

export async function appendBrandedCtaCard(args: ComposeCtaArgs) {
  const width = args.width ?? 1080;
  const height = args.height ?? 1920;
  const duration = args.durationSeconds ?? 2;
  const title = args.title ?? "Turn Real Work Into Marketing";
  const subtitle =
    args.subtitle ?? "Create campaigns from everyday business activity";
  const ctaLabel = args.ctaLabel ?? "Start Free";
  const brandLabel = args.brandLabel ?? "ShopReel by ProFixIQ";

  await mkdir(args.workDir, { recursive: true });

  const ctaVideoPath = path.join(args.workDir, "cta-card.mp4");
  const concatFilePath = path.join(args.workDir, "concat.txt");

  const filter = [
    `color=c=#081121:size=${width}x${height}:duration=${duration}`,
    `format=yuv420p`,
    `drawbox=x=0:y=0:w=iw:h=ih:color=#0b1730@0.88:t=fill`,
    `drawbox=x=90:y=220:w=${width - 180}:h=620:color=#111a33@0.92:t=fill`,
    `drawbox=x=90:y=220:w=${width - 180}:h=620:color=#7dd3fc@0.18:t=3`,
    `drawtext=text='${escapeDrawtext(brandLabel)}':fontcolor=white@0.55:fontsize=34:x=120:y=280`,
    `drawtext=text='${escapeDrawtext(title)}':fontcolor=white:fontsize=72:x=120:y=420`,
    `drawtext=text='${escapeDrawtext(subtitle)}':fontcolor=white@0.72:fontsize=38:x=120:y=560:line_spacing=10`,
    `drawbox=x=120:y=760:w=360:h=120:color=#1d4ed8@0.88:t=fill`,
    `drawbox=x=120:y=760:w=360:h=120:color=#93c5fd@0.28:t=3`,
    `drawtext=text='${escapeDrawtext(ctaLabel)}':fontcolor=white:fontsize=42:x=210:y=798`,
    `drawtext=text='shopreel.profixiq.com':fontcolor=white@0.5:fontsize=30:x=120:y=940`,
  ].join(",");

  await run("ffmpeg", [
    "-y",
    "-f",
    "lavfi",
    "-i",
    filter,
    "-t",
    String(duration),
    "-pix_fmt",
    "yuv420p",
    ctaVideoPath,
  ]);

  await writeFile(
    concatFilePath,
    `file '${args.inputVideoPath.replace(/'/g, "'\\''")}'\nfile '${ctaVideoPath.replace(/'/g, "'\\''")}'\n`
  );

  await run("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatFilePath,
    "-c",
    "copy",
    args.outputVideoPath,
  ]);

  return {
    ctaVideoPath,
    outputVideoPath: args.outputVideoPath,
  };
}
