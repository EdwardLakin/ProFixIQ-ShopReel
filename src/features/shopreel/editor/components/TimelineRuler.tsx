"use client";

import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import { formatSecondsLabel, msToTimelinePx } from "@/features/shopreel/editor/lib/timeline";

type Props = {
  durationMs: number;
};

export default function TimelineRuler(props: Props) {
  const { durationMs } = props;
  const totalSeconds = Math.max(1, Math.ceil(durationMs / 1000));
  const ticks = Array.from({ length: totalSeconds + 1 }, (_, i) => i);

  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-2xl border",
        glassTheme.border.softer,
        glassTheme.glass.panelSoft,
      )}
    >
      <div className="grid min-h-[44px] grid-cols-[84px_1fr]">
        <div
          className={cx(
            "flex items-center border-r px-3 text-[11px] font-medium uppercase tracking-[0.18em]",
            glassTheme.border.softer,
            glassTheme.text.secondary,
          )}
        >
          Time
        </div>

        <div className="relative h-[44px]">
          {ticks.map((second) => {
            const left = msToTimelinePx(second * 1000);
            return (
              <div
                key={second}
                className="absolute top-0 h-full"
                style={{ left }}
              >
                <div className="h-3 w-px bg-white/20" />
                <div className="pt-1 text-[11px] text-white/55">
                  {formatSecondsLabel(second)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
