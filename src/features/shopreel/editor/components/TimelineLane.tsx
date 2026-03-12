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
        "relative overflow-hidden rounded-2xl border",
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

        <div className="relative min-h-[72px] touch-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:28px_100%]" />

          {clips
            .filter((clip) => clip.lane === lane)
            .map((clip) => {
              const left = msToTimelinePx(clip.startMs);
              const width = Math.max(56, msToTimelinePx(clip.endMs - clip.startMs));

              return (
                <div
                  key={clip.id}
                  className={cx(
                    "absolute top-3 h-[48px] rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
                    clip.colorClass,
                    selectedClipId === clip.id
                      ? "ring-2 ring-sky-300/35"
                      : "hover:ring-1 hover:ring-white/15",
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
                    <div className="truncate text-xs font-medium text-white">{clip.label}</div>
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