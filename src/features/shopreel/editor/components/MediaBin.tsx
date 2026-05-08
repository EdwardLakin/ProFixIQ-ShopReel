"use client";

import Link from "next/link";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { EditorPanelStack } from "@/features/shopreel/editor/components/EditorStudioPrimitives";

export type MediaBinItem = {
  id: string;
  label: string;
  type: "image" | "video" | "unknown";
  url: string | null;
};

type Props = {
  items: MediaBinItem[];
};

function MediaPreview({ item }: { item: MediaBinItem }) {
  if (item.url && item.type === "image") {
    return (
      <img
        src={item.url}
        alt={item.label}
        className="h-full w-full object-cover"
      />
    );
  }

  if (item.url && item.type === "video") {
    return (
      <video
        src={item.url}
        className="h-full w-full object-cover"
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  return (
    <div className="flex h-full items-end justify-between bg-[radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.18),transparent_42%),radial-gradient(circle_at_90%_15%,rgba(168,85,247,0.2),transparent_40%)] p-3">
      <div>
        <div className="h-8 w-8 rounded-xl border border-white/15 bg-white/10" />
        <p className="mt-2 text-[11px] text-white/55">Preview pending</p>
      </div>
      <GlassBadge tone="muted">{item.type}</GlassBadge>
    </div>
  );
}

export default function MediaBin({ items }: Props) {
  return (
    <EditorPanelStack title="Source media" eyebrow="Media bin">
      <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.035] p-3">
        <p className="text-xs text-white/70">
          Assign uploaded images and clips into the timeline. Media stays operator-controlled.
        </p>
      </div>

      {items.length === 0 ? (
        <div
          className={cx(
            "overflow-hidden rounded-2xl border",
            glassTheme.border.softer,
            "bg-[linear-gradient(160deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))]",
          )}
        >
          <div className="grid aspect-[4/3] place-items-center border-b border-white/10 bg-[radial-gradient(circle_at_50%_30%,rgba(34,211,238,0.16),transparent_38%)]">
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.035] p-5 text-center">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-white/10 shadow-[0_0_40px_rgba(34,211,238,0.16)]" />
              <p className="mt-3 text-sm font-medium text-white">No source media yet</p>
              <p className="mt-1 max-w-52 text-xs text-white/55">
                Upload assets or generate visuals before assigning clips to scenes.
              </p>
            </div>
          </div>

          <div className="space-y-2 p-3">
            <Link href="/shopreel/upload">
              <GlassButton variant="secondary">Upload media</GlassButton>
            </Link>
            <Link href="/shopreel/create">
              <GlassButton variant="ghost">Generate AI visual</GlassButton>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
          {items.map((item, index) => (
            <article
              key={item.id}
              className={cx(
                "group overflow-hidden rounded-2xl border transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/35 hover:shadow-[0_20px_55px_rgba(8,47,73,0.35)]",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className="relative aspect-video overflow-hidden bg-black/40">
                <MediaPreview item={item} />
                <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/70 backdrop-blur">
                  Asset {index + 1}
                </div>
                <div className="absolute bottom-3 right-3">
                  <GlassBadge tone="default">{item.type}</GlassBadge>
                </div>
              </div>

              <div className="space-y-3 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">{item.label}</div>
                  <div className={cx("mt-1 truncate text-xs", glassTheme.text.secondary)}>
                    {item.url ?? "No URL attached yet"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <GlassButton variant="ghost">Open</GlassButton>
                    </a>
                  ) : (
                    <span />
                  )}

                  <Link href="/shopreel/upload">
                    <GlassButton variant="secondary">Replace</GlassButton>
                  </Link>
                </div>

                <Link href="/shopreel/create">
                  <GlassButton variant="ghost">Generate variant</GlassButton>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </EditorPanelStack>
  );
}