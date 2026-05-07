import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import { createAdminClient } from "@/lib/supabase/server";
import {
  ShopReelEmptyState,
  ShopReelPageHero,
  ShopReelSurface,
} from "@/features/shopreel/ui/system/ShopReelPagePrimitives";

const MODES = [
  "Draft review",
  "Caption editing",
  "Thumbnail direction",
  "Export packaging",
  "Platform adaptation",
];

const SOURCE_LABELS: Record<string, string> = {
  idea: "Ideas",
  ideas: "Ideas",
  library: "Library",
  review: "Review",
  manual: "Manual",
  manual_create: "Manual",
};

type StoryDraft = { title?: string };
type GenerationMetadata = {
  platformIds?: unknown;
  source?: unknown;
  sourceType?: unknown;
  createdFrom?: unknown;
};

type GenerationRow = {
  id: string;
  status: string | null;
  created_at: string;
  updated_at: string | null;
  story_draft: StoryDraft | null;
  generation_metadata: GenerationMetadata | null;
};

function formatRelativeDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  const elapsedMs = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (elapsedMs < hour) {
    return `${Math.max(1, Math.floor(elapsedMs / minute))}m ago`;
  }

  if (elapsedMs < day) {
    return `${Math.floor(elapsedMs / hour)}h ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatAbsoluteDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function toPlatformLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function getSourceLabel(metadata: GenerationMetadata | null): string {
  const rawSource = metadata?.source ?? metadata?.sourceType ?? metadata?.createdFrom;
  if (typeof rawSource !== "string") return "Manual";

  const normalized = rawSource.toLowerCase().trim();
  return SOURCE_LABELS[normalized] ?? "Manual";
}

export default async function ShopReelEditorHubPage() {
  const supabase = createAdminClient();
  const { data: generations } = await supabase
    .from("shopreel_story_generations")
    .select("id, status, created_at, updated_at, story_draft, generation_metadata")
    .order("created_at", { ascending: false })
    .limit(12);

  const items: GenerationRow[] = (generations ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    story_draft:
      row.story_draft && typeof row.story_draft === "object" && !Array.isArray(row.story_draft)
        ? (row.story_draft as StoryDraft)
        : null,
    generation_metadata:
      row.generation_metadata &&
      typeof row.generation_metadata === "object" &&
      !Array.isArray(row.generation_metadata)
        ? (row.generation_metadata as GenerationMetadata)
        : null,
  }));

  return (
    <GlassShell title="Editor" hidePageIntro>
      <div className="space-y-4">
        <ShopReelPageHero
          title="Editor"
          subtitle="Open drafts and finished assets for editing, packaging, and export prep."
          actions={[
            { label: "Create content", href: "/shopreel/create", primary: true },
            { label: "Open projects", href: "/shopreel/generations" },
          ]}
        />
        <ShopReelSurface title="Editor modes">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {MODES.map((mode) => (
              <div
                key={mode}
                className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white/80"
              >
                {mode}
              </div>
            ))}
          </div>
        </ShopReelSurface>
        <ShopReelSurface title="Recent editable projects">
          {items.length === 0 ? (
            <ShopReelEmptyState
              title="No editable projects yet"
              description="Create a draft first, then return here to refine and package it."
            />
          ) : (
            <div className="grid gap-2">
              {items.map((item) => {
                const title = item.story_draft?.title?.trim() || "Untitled generation";
                const labeledTitle = `${title} · ${item.id.slice(0, 8)}`;
                const relativeCreated = formatRelativeDateTime(item.created_at);
                const absoluteCreated = formatAbsoluteDateTime(item.created_at);
                const hasUpdated = Boolean(item.updated_at);
                const relativeUpdated = item.updated_at ? formatRelativeDateTime(item.updated_at) : null;
                const absoluteUpdated = item.updated_at ? formatAbsoluteDateTime(item.updated_at) : null;
                const platforms = toPlatformLabels(item.generation_metadata?.platformIds);
                const sourceLabel = getSourceLabel(item.generation_metadata);

                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3"
                  >
                    <div className="space-y-1">
                      <div className="text-sm text-white">{labeledTitle}</div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/60">
                        <span className="capitalize">Status: {item.status ?? "unknown"}</span>
                        <span>Source: {sourceLabel}</span>
                        <span>
                          Platforms: {platforms.length > 0 ? `${platforms.join(", ")} (${platforms.length})` : "None"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/55">
                        <span title={absoluteCreated}>Created: {relativeCreated}</span>
                        {hasUpdated && relativeUpdated && absoluteUpdated ? (
                          <span title={absoluteUpdated}>Updated: {relativeUpdated}</span>
                        ) : null}
                      </div>
                    </div>
                    <Link className="text-xs text-cyan-200" href={`/shopreel/editor/video/${item.id}`}>
                      Open editor
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </ShopReelSurface>
      </div>
    </GlassShell>
  );
}
