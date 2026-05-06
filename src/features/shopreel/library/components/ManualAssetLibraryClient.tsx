"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";

type ManualAssetFile = {
  id: string;
  file_name: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  storage_path: string;
  bucket: string;
  sort_order: number;
};

type ManualAsset = {
  id: string;
  title: string | null;
  description: string | null;
  asset_type: string;
  status: string;
  content_goal: string | null;
  note: string | null;
  primary_file_url: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
  ai_summary?: string | null;
  ai_tags?: string[] | null;
  ai_use_cases?: string[] | null;
  analyzed_at?: string | null;
  files?: ManualAssetFile[];
};

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "—";
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}

function buildCreatePrompt(asset: ManualAsset) {
  const fileNames = (asset.files ?? [])
    .map((file) => file.file_name)
    .filter((name): name is string => typeof name === "string" && name.trim().length > 0);

  return [
    `Create content from this uploaded media set: ${asset.title ?? "Untitled upload"}.`,
    asset.description ? `Context: ${asset.description}` : "",
    fileNames.length > 0 ? `Uploaded files: ${fileNames.join(", ")}` : "",
    "Generate a useful social post or short-form content concept based on these assets.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function saveCreatePrefill(asset: ManualAsset) {
  const prompt = buildCreatePrompt(asset);

  window.localStorage.setItem(
    "shopreel:createPrefill",
    JSON.stringify({
      prompt,
      contentType: asset.asset_type === "video" ? "Short-form video" : "Social post",
      source: "library",
      manualAssetId: asset.id,
      createdAt: Date.now(),
    }),
  );

  return prompt;
}

export default function ManualAssetLibraryClient() {
  const [assets, setAssets] = useState<ManualAsset[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [assetType, setAssetType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadAssets() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/shopreel/library/manual-assets", {
        cache: "no-store",
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        assets?: ManualAsset[];
      };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to load library.");
      }

      setAssets(json.assets ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load library.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAssets();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return assets.filter((asset) => {
      const typePass = assetType === "all" || asset.asset_type === assetType;
      const haystack = [
        asset.title,
        asset.description,
        asset.note,
        asset.content_goal,
        ...(asset.files ?? []).map((file) => file.file_name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return typePass && (!needle || haystack.includes(needle));
    });
  }, [assetType, assets, query]);

  const selectedAssets = assets.filter((asset) => selectedIds.includes(asset.id));

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function analyzeAsset(assetId: string) {
    try {
      setAnalyzingId(assetId);
      setError(null);

      const res = await fetch(`/api/shopreel/library/manual-assets/${assetId}/analyze`, {
        method: "POST",
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to analyze asset.");
      }

      await loadAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze asset.");
    } finally {
      setAnalyzingId(null);
    }
  }

  function saveMultiAssetPrefill() {
    const prompt = [
      "Create content from these selected uploaded assets.",
      ...selectedAssets.map((asset, index) => {
        const files = (asset.files ?? [])
          .map((file) => file.file_name)
          .filter(Boolean)
          .join(", ");
        return `${index + 1}. ${asset.title ?? "Untitled upload"}${files ? ` — ${files}` : ""}`;
      }),
      "Find the strongest content angle and generate platform-ready output.",
    ].join("\n");

    window.localStorage.setItem(
      "shopreel:createPrefill",
      JSON.stringify({
        prompt,
        contentType: selectedAssets.some((asset) => asset.asset_type === "video")
          ? "Short-form video"
          : "Social post",
        source: "library",
        manualAssetIds: selectedIds,
        createdAt: Date.now(),
      }),
    );

    return prompt;
  }

  return (
    <div className="space-y-4">
      <GlassCard label="Asset library" title="Uploaded media">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_160px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search uploaded media, filenames, notes..."
            className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
          />
          <select
            value={assetType}
            onChange={(event) => setAssetType(event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="all">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="mixed">Mixed</option>
          </select>
          <GlassButton variant="ghost" onClick={() => void loadAssets()}>
            Refresh
          </GlassButton>
        </div>

        {selectedAssets.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.06] p-3">
            <div className="text-sm text-white">{selectedAssets.length} selected</div>
            <Link
              href={`/shopreel/create?source=library&prompt=${encodeURIComponent(saveMultiAssetPrefill())}`}
              onClick={() => saveMultiAssetPrefill()}
            >
              <GlassButton>Create from selected</GlassButton>
            </Link>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-500/10 p-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-4 text-sm text-white/60">Loading library…</div>
        ) : null}

        {!loading && filtered.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5">
            <div className="text-base font-semibold text-white">No uploaded assets yet.</div>
            <p className="mt-2 text-sm text-white/65">
              Upload media in Create first, then return here to reuse it across posts, reels, blogs, and campaigns.
            </p>
            <div className="mt-4">
              <Link href="/shopreel/create">
                <GlassButton>Create and upload media</GlassButton>
              </Link>
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {filtered.map((asset) => {
            const selected = selectedIds.includes(asset.id);
            const files = [...(asset.files ?? [])].sort((a, b) => a.sort_order - b.sort_order);
            const firstFile = files[0] ?? null;

            return (
              <article
                key={asset.id}
                className={`rounded-3xl border p-4 transition ${
                  selected
                    ? "border-cyan-300/40 bg-cyan-400/[0.08]"
                    : "border-white/10 bg-white/[0.035]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-white">
                      {asset.title ?? "Untitled upload"}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <GlassBadge tone="muted">{asset.asset_type}</GlassBadge>
                      <GlassBadge tone="muted">{asset.status}</GlassBadge>
                      <GlassBadge tone="muted">{files.length} file{files.length === 1 ? "" : "s"}</GlassBadge>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleSelected(asset.id)}
                    className="mt-1 h-4 w-4"
                    aria-label={`Select ${asset.title ?? asset.id}`}
                  />
                </div>

                {asset.description ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/70">
                    {asset.description}
                  </p>
                ) : null}

                {asset.ai_summary ? (
                  <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.06] p-3">
                    <div className="mb-1 text-xs uppercase tracking-[0.16em] text-cyan-100/60">
                      AI read
                    </div>
                    <p className="text-sm leading-6 text-white/75">{asset.ai_summary}</p>
                    {asset.ai_tags && asset.ai_tags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {asset.ai_tags.slice(0, 8).map((tag) => (
                          <span key={tag} className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[11px] text-white/70">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {asset.ai_use_cases && asset.ai_use_cases.length > 0 ? (
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-white/60">
                        {asset.ai_use_cases.slice(0, 3).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="mb-2 text-xs uppercase tracking-[0.16em] text-white/45">
                    Files
                  </div>
                  {files.length === 0 ? (
                    <div className="text-sm text-white/50">No file metadata captured.</div>
                  ) : (
                    <div className="space-y-1.5">
                      {files.slice(0, 4).map((file) => (
                        <div key={file.id} className="flex items-center justify-between gap-3 text-xs text-white/65">
                          <span className="truncate">{file.file_name ?? file.storage_path}</span>
                          <span>{formatBytes(file.file_size_bytes)}</span>
                        </div>
                      ))}
                      {files.length > 4 ? (
                        <div className="text-xs text-white/45">+{files.length - 4} more</div>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/shopreel/create?source=library&prompt=${encodeURIComponent(buildCreatePrompt(asset))}`}
                    onClick={() => saveCreatePrefill(asset)}
                  >
                    <GlassButton variant="ghost">Create from this</GlassButton>
                  </Link>
                  <GlassButton
                    variant="ghost"
                    onClick={() => void analyzeAsset(asset.id)}
                    disabled={analyzingId === asset.id}
                  >
                    {analyzingId === asset.id ? "Analyzing..." : asset.ai_summary ? "Re-analyze" : "Analyze"}
                  </GlassButton>
                  {firstFile ? (
                    <GlassBadge tone="muted">{firstFile.mime_type ?? "media"}</GlassBadge>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
