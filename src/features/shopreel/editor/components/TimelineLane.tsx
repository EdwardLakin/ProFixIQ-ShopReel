"use client";

import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import type { TimelineClip } from "@/features/shopreel/editor/lib/timeline";
import { msToTimelinePx } from "@/features/shopreel/editor/lib/timeline";

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

        <div className="relative min-h-[72px]">
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
                    onMouseDown={(e) => {
                      if (!onDragScene) return;
                      const dragScene = onDragScene;
                      const startX = e.clientX;

                      function onMove(ev: MouseEvent) {
                        dragScene(clip.sceneId, ev.clientX - startX);
                      }

                      function onUp() {
                        window.removeEventListener("mousemove", onMove);
                        window.removeEventListener("mouseup", onUp);
                      }

                      window.addEventListener("mousemove", onMove);
                      window.addEventListener("mouseup", onUp);
                    }}
                    className="h-full w-full cursor-grab rounded-xl px-3 text-left active:cursor-grabbing"
                  >
                    <div className="truncate text-xs font-medium text-white">{clip.label}</div>
                  </button>

                  {onResizeScene ? (
                    <button
                      type="button"
                      aria-label="Resize clip"
                      className="absolute right-0 top-0 h-full w-3 rounded-r-xl bg-white/10 hover:bg-white/20"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const resizeScene = onResizeScene;
                        const startX = e.clientX;

                        function onMove(ev: MouseEvent) {
                          resizeScene(clip.sceneId, ev.clientX - startX);
                        }

                        function onUp() {
                          window.removeEventListener("mousemove", onMove);
                          window.removeEventListener("mouseup", onUp);
                        }

                        window.addEventListener("mousemove", onMove);
                        window.addEventListener("mouseup", onUp);
                      }}
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
