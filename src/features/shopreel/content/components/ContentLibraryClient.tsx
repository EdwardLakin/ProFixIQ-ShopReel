"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { getEditorPath } from "@/features/shopreel/lib/editorPaths";
import { getReviewPath } from "@/features/shopreel/lib/reviewPaths";

type OutputType = "video" | "blog" | "email" | "post" | "vlog";

type ContentLibraryItem = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  outputType: OutputType;
  sourceKind: string;
};

type Props = {
  initialItems: ContentLibraryItem[];
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function editorPath(outputType: OutputType, generationId: string) {
  return getEditorPath(outputType, generationId);
}

export default function ContentLibraryClient({ initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<ContentLibraryItem[]>(initialItems);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => items.length, [items]);

  async function deleteGeneration(item: ContentLibraryItem) {
    const confirmed = window.confirm(
      `Delete "${item.title}"?\n\nThis removes the generated item and its linked publish/render records.`
    );
    if (!confirmed) return;

    try {
      setError(null);
      setDeletingId(item.id);

      const res = await fetch(`/api/shopreel/story-generations/${item.id}`, {
        method: "DELETE",
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to delete content");
      }

      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete content");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <GlassCard
      label="Library"
      title="All generated content"
      description="Browse every generated content item regardless of output type."
      strong
      footer={
        <div className="flex flex-wrap gap-2">
          <GlassBadge tone="default">{total} items</GlassBadge>
        </div>
      }
    >
      {error ? (
        <div
          className={cx(
            "mb-4 rounded-2xl border p-4 text-sm",
            glassTheme.border.copper,
            glassTheme.glass.panelSoft,
            glassTheme.text.copperSoft
          )}
        >
          {error}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div
          className={cx(
            "rounded-2xl border p-4 text-sm",
            glassTheme.border.softer,
            glassTheme.glass.panelSoft,
            glassTheme.text.secondary
          )}
        >
          No content yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => {
            const busyDelete = deletingId === item.id;

            return (
              <div
                key={item.id}
                className={cx(
                  "rounded-2xl border p-4",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                      {item.title}
                    </div>

                    <div className={cx("text-sm", glassTheme.text.secondary)}>
                      {formatLabel(item.outputType)} • {formatLabel(item.sourceKind)}
                    </div>

                    <div className={cx("text-sm", glassTheme.text.muted)}>
                      Status: {formatLabel(item.status)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <GlassBadge tone="default">{formatLabel(item.outputType)}</GlassBadge>
                    <GlassBadge tone="muted">{formatLabel(item.status)}</GlassBadge>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={getReviewPath(item.outputType, item.id)}>
                    <GlassButton variant="ghost">Review</GlassButton>
                  </Link>

                  <Link href={editorPath(item.outputType, item.id)}>
                    <GlassButton variant="secondary">Edit</GlassButton>
                  </Link>

                  <GlassButton
                    variant="ghost"
                    onClick={() => void deleteGeneration(item)}
                    disabled={busyDelete}
                  >
                    {busyDelete ? "Deleting..." : "Delete"}
                  </GlassButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
