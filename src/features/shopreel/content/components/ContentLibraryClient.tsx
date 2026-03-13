"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

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
  if (outputType === "blog") return `/shopreel/editor/blog/${generationId}`;
  if (outputType === "email") return `/shopreel/editor/email/${generationId}`;
  if (outputType === "post") return `/shopreel/editor/post/${generationId}`;
  if (outputType === "vlog") return `/shopreel/editor/vlog/${generationId}`;
  return `/shopreel/editor/${generationId}`;
}

export default function ContentLibraryClient({ initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<ContentLibraryItem[]>(initialItems);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => items.length, [items]);

  async function deleteGeneration(item: ContentLibraryItem) {
    const confirmed = window.confirm(`Delete "${item.title}"?`);
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
            glassTheme.text.copperSoft,
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
            glassTheme.text.secondary,
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
                  "grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_auto]",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                )}
              >
                <div className="space-y-1">
                  <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                    {item.title}
                  </div>
                  <div className={cx("text-sm", glassTheme.text.secondary)}>
                    {formatLabel(item.outputType)} • {formatLabel(item.sourceKind)} •{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                  <GlassBadge tone="copper">{formatLabel(item.outputType)}</GlassBadge>
                  <GlassBadge tone="default">{formatLabel(item.status)}</GlassBadge>

                  <Link href={`/shopreel/generations/${item.id}`}>
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
