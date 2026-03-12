"use client";

import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";

export type MediaBinItem = {
  id: string;
  label: string;
  type: "image" | "video" | "unknown";
  url: string | null;
};

type Props = {
  items: MediaBinItem[];
};

export default function MediaBin(props: Props) {
  const { items } = props;

  return (
    <GlassCard
      label="Media Bin"
      title="Source media"
      description="Uploaded and linked assets available for timeline assignment."
      strong
    >
      {items.length === 0 ? (
        <div
          className={cx(
            "rounded-2xl border p-4 text-sm",
            glassTheme.border.softer,
            glassTheme.glass.panelSoft,
            glassTheme.text.secondary,
          )}
        >
          No media linked yet. Timeline structure is ready for asset assignment next.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
          {items.map((item) => (
            <div
              key={item.id}
              className={cx(
                "flex items-center justify-between gap-3 rounded-2xl border p-3",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">{item.label}</div>
                <div className={cx("truncate text-xs", glassTheme.text.secondary)}>
                  {item.url ?? "No URL yet"}
                </div>
              </div>
              <GlassBadge tone="default">{item.type}</GlassBadge>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
