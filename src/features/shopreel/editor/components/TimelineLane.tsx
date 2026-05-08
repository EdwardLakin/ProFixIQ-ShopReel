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

export default function TimelineLane(props: Props) {
  const {
    label,
    lane,
    clips,
    selectedClipId,
    onSelectClip,
    onDragScene,
    onResizeScene,
  } = props;

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

      if (action === "drag" && onDragScene) {
        onDragScene(sceneId, stepDelta * PX_PER_SECOND);
      }

      if (action === "resize" && onResizeScene) {
        onResizeScene(sceneId, stepDelta * PX_PER_SECOND);
      }
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

  return (
    <div
      className={cx(
        "group relative overflow-hidden rounded-2xl border bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.16),transparent_45%),radial-gradient(circle_at_100%_100%,rgba(147,51,234,0.2),transparent_50%)] backdrop-blur-xl transition hover:-translate-y-0.5",
        glassTheme.border.softer,
        glassTheme.glass.panelSoft,
      )}
    >
      <div className="grid min-h-[72px] grid-cols-[84px_1fr]">
        <div
          className={cx(
            "flex items-center border-r px-3 text-xs font-medium uppercase tracking-[0.18em]",
            glassTheme.border.softer,
            glassTheme.text.secondary,
          )}
        >
          {label}
        </div>

        <div className="relative min-h-[84px] touch-none overflow-x-auto">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[length:28px_100%]" />
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-slate-950/50 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-slate-950/50 to-transparent" />

          {clips
            .filter((clip) => clip.lane === lane)
            .map((clip) => {
              const left = msToTimelinePx(clip.startMs);
              const width = Math.max(56, msToTimelinePx(clip.endMs - clip.startMs));

              return (
                <div
                  key={clip.id}
                  className={cx(
                    "absolute top-4 h-[52px] rounded-xl border shadow-[0_10px_32px_rgba(15,23,42,0.55),inset_0_1px_0_rgba(255,255,255,0.16)] transition",
                    clip.colorClass,
                    selectedClipId === clip.id
                      ? "ring-2 ring-sky-300/50 shadow-[0_0_0_1px_rgba(125,211,252,0.4),0_0_24px_rgba(59,130,246,0.45)]"
                      : "hover:ring-1 hover:ring-violet-200/35 hover:shadow-[0_0_20px_rgba(139,92,246,0.25)]",
                  )}
                  style={{
                    left: `${left}px`,
                    width: `${width}px`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onSelectClip(clip.id, clip.sceneId, clip.lane)}
                    onPointerDown={(e) => beginPointerAction(e, clip.sceneId, "drag")}
                    className="h-full w-full cursor-grab touch-none rounded-xl px-3 text-left active:cursor-grabbing"
                  >
                    <div className="truncate text-xs font-semibold text-white">{clip.label}</div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-white/75"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300/90" />{Math.round((clip.endMs-clip.startMs)/1000)}s clip</div>
                  </button>

                  {onResizeScene ? (
                    <button
                      type="button"
                      aria-label="Resize clip"
                      className="absolute right-0 top-0 h-full w-3 touch-none rounded-r-xl bg-white/10 hover:bg-white/20"
                      onPointerDown={(e) => beginPointerAction(e, clip.sceneId, "resize")}
                    />
                  ) : null}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}