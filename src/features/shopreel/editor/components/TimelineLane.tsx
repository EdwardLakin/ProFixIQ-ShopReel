"use client";

import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import type { TimelineClip } from "@/features/shopreel/editor/lib/timeline";
import { msToTimelinePx, PX_PER_SECOND } from "@/features/shopreel/editor/lib/timeline";

type Props = {
  label: string;
  lane: TimelineClip["lane"];
  clips: TimelineClip[];
  selectedClipId: string | null;
  onSelectClip: (clipId: string, sceneId: string, lane: TimelineClip["lane"]) => void;
  onDragScene?: (sceneId: string, deltaPx: number) => void;
  onResizeScene?: (sceneId: string, deltaPx: number) => void;
};

function laneTone(lane: TimelineClip["lane"]) {
  switch (lane) {
    case "video":
      return "from-cyan-300/25 via-sky-400/15 to-blue-500/15";
    case "voiceover":
      return "from-emerald-300/20 via-teal-400/15 to-cyan-500/10";
    case "overlay":
    case "subtitles":
      return "from-violet-300/25 via-fuchsia-400/15 to-purple-500/10";
    default:
      return "from-white/15 via-white/10 to-white/5";
  }
}

export default function TimelineLane({
  label,
  lane,
  clips,
  selectedClipId,
  onSelectClip,
  onDragScene,
  onResizeScene,
}: Props) {
  function beginPointerAction(
    e: React.PointerEvent<HTMLElement>,
    sceneId: string,
    action: "drag" | "resize",
  ) {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    let lastStep = 0;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore if unsupported
    }

    function handleMove(ev: PointerEvent) {
      const deltaPx = ev.clientX - startX;
      const currentStep = Math.trunc(deltaPx / PX_PER_SECOND);
      if (currentStep === lastStep) return;

      const stepDelta = currentStep - lastStep;
      lastStep = currentStep;

      if (action === "drag" && onDragScene) onDragScene(sceneId, stepDelta * PX_PER_SECOND);
      if (action === "resize" && onResizeScene) onResizeScene(sceneId, stepDelta * PX_PER_SECOND);
    }

    function handleUp() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  }

  const laneClips = clips.filter((clip) => clip.lane === lane);

  return (
    <div
      className={cx(
        "group relative overflow-hidden rounded-2xl border backdrop-blur-xl transition hover:border-cyan-300/25",
        glassTheme.border.softer,
        "bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(2,6,23,0.88))]",
      )}
    >
      <div className="grid min-h-[86px] grid-cols-[96px_1fr]">
        <div
          className={cx(
            "relative flex flex-col justify-center border-r px-3",
            glassTheme.border.softer,
          )}
        >
          <div className={cx("absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b", laneTone(lane))} />
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
            {label}
          </div>
          <div className="mt-1 text-[11px] text-white/35">{laneClips.length} clips</div>
        </div>

        <div className="relative min-h-[92px] touch-none overflow-x-auto">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[length:30px_100%]" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-white/[0.055]" />
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-slate-950/70 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-slate-950/70 to-transparent" />

          {laneClips.length === 0 ? (
            <div className="absolute inset-y-4 left-4 flex items-center rounded-xl border border-dashed border-white/12 bg-white/[0.025] px-4 text-xs text-white/35">
              Drop or generate {label.toLowerCase()} clips
            </div>
          ) : null}

          {laneClips.map((clip, index) => {
            const left = msToTimelinePx(clip.startMs);
            const width = Math.max(64, msToTimelinePx(clip.endMs - clip.startMs));
            const durationSeconds = Math.round((clip.endMs - clip.startMs) / 1000);
            const isSelected = selectedClipId === clip.id;

            return (
              <div
                key={clip.id}
                className={cx(
                  "absolute top-4 h-[58px] rounded-2xl border shadow-[0_14px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.16)] transition",
                  clip.colorClass,
                  isSelected
                    ? "z-20 ring-2 ring-cyan-200/60 shadow-[0_0_0_1px_rgba(125,211,252,0.45),0_0_34px_rgba(34,211,238,0.38)]"
                    : "z-10 hover:-translate-y-0.5 hover:ring-1 hover:ring-violet-200/35 hover:shadow-[0_0_24px_rgba(139,92,246,0.22)]",
                )}
                style={{ left: `${left}px`, width: `${width}px` }}
              >
                <button
                  type="button"
                  onClick={() => onSelectClip(clip.id, clip.sceneId, clip.lane)}
                  onPointerDown={(e) => beginPointerAction(e, clip.sceneId, "drag")}
                  className="h-full w-full cursor-grab touch-none rounded-2xl px-3 py-2 text-left active:cursor-grabbing"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 truncate text-xs font-semibold text-white">
                      {clip.label}
                    </div>
                    <span className="shrink-0 rounded-full bg-black/25 px-1.5 py-0.5 text-[9px] text-white/75">
                      {index + 1}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-white/75">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/90 shadow-[0_0_10px_rgba(110,231,183,0.7)]" />
                      {durationSeconds}s
                    </span>
                    <span className="truncate text-white/50">{lane}</span>
                  </div>
                </button>

                {onResizeScene ? (
                  <button
                    type="button"
                    aria-label="Resize clip"
                    className="absolute right-0 top-0 h-full w-3 touch-none rounded-r-2xl border-l border-white/10 bg-white/10 hover:bg-white/20"
                    onPointerDown={(e) => beginPointerAction(e, clip.sceneId, "resize")}
                  >
                    <span className="mx-auto block h-full w-px bg-white/25" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}