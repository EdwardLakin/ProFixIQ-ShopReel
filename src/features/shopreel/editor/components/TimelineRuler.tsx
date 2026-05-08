"use client";

import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import { formatSecondsLabel, msToTimelinePx } from "@/features/shopreel/editor/lib/timeline";

type Props = {
  durationMs: number;
};

export default function TimelineRuler({ durationMs }: Props) {
  const totalSeconds = Math.max(1, Math.ceil(durationMs / 1000));
  const ticks = Array.from({ length: totalSeconds + 1 }, (_, i) => i);

  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-2xl border",
        glassTheme.border.softer,
        "bg-[linear-gradient(180deg,rgba(15,23,42,0.86),rgba(2,6,23,0.96))]",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className="grid min-h-[52px] grid-cols-[96px_1fr]">
        <div
          className={cx(
            "relative flex items-center border-r px-3",
            glassTheme.border.softer,
          )}
        >
          <div className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b from-cyan-300/70 to-violet-400/70" />

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Timeline
            </div>
            <div className="mt-1 text-[11px] text-white/30">
              {formatSecondsLabel(totalSeconds)}
            </div>
          </div>
        </div>

        <div className="relative h-[52px] overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[length:30px_100%]" />

          {ticks.map((second) => {
            const left = msToTimelinePx(second * 1000);

            return (
              <div
                key={second}
                className="absolute top-0 h-full"
                style={{ left }}
              >
                <div className="flex h-full flex-col items-start">
                  <div
                    className={cx(
                      "w-px flex-1",
                      second % 5 === 0
                        ? "bg-cyan-300/30"
                        : "bg-white/12",
                    )}
                  />

                  <div
                    className={cx(
                      "pb-1 pt-1 text-[10px] font-medium",
                      second % 5 === 0
                        ? "text-cyan-100/80"
                        : "text-white/40",
                    )}
                  >
                    {formatSecondsLabel(second)}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-950/80 to-transparent" />
        </div>
      </div>
    </div>
  );
}