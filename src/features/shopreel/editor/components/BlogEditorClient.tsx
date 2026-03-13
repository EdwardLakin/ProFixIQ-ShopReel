"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassInput from "@/features/shopreel/ui/system/GlassInput";
import GlassTextarea from "@/features/shopreel/ui/system/GlassTextarea";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

type BlogSection = {
  key: string;
  title: string;
  body: string;
};

type Props = {
  generationId: string;
  initialTitle: string;
  initialSections: BlogSection[];
  initialBody: string;
};

function rebuildBodyFromSections(sections: BlogSection[]) {
  return sections
    .map((section, index) => {
      if (index === 0) return section.body;
      return `## ${section.title}\n\n${section.body}`;
    })
    .join("\n\n");
}

export default function BlogEditorClient(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState(props.initialTitle);
  const [sections, setSections] = useState<BlogSection[]>(props.initialSections);
  const [isSaving, setIsSaving] = useState(false);
  const [runningSectionKey, setRunningSectionKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedKey = searchParams.get("section");
  const selectedSection = useMemo(() => {
    if (selectedKey) {
      return sections.find((section) => section.key === selectedKey) ?? sections[0] ?? null;
    }
    return sections[0] ?? null;
  }, [sections, selectedKey]);

  const bodyPreview = useMemo(() => rebuildBodyFromSections(sections), [sections]);

  function patchSection(sectionKey: string, patch: Partial<BlogSection>) {
    setSections((current) =>
      current.map((section) =>
        section.key === sectionKey ? { ...section, ...patch } : section,
      ),
    );
  }

  async function saveBlog() {
    try {
      setError(null);
      setIsSaving(true);

      const res = await fetch(`/api/shopreel/story-generations/${props.generationId}/blog`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          sections,
        }),
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to save blog");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save blog");
    } finally {
      setIsSaving(false);
    }
  }

  async function regenerateSection(sectionKey: string) {
    try {
      setError(null);
      setRunningSectionKey(sectionKey);

      const saveRes = await fetch(`/api/shopreel/story-generations/${props.generationId}/blog`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          sections,
        }),
      });

      const saveJson = (await saveRes.json()) as { ok?: boolean; error?: string };
      if (!saveRes.ok || !saveJson.ok) {
        throw new Error(saveJson.error ?? "Failed to save before regeneration");
      }

      const res = await fetch(`/api/shopreel/story-generations/${props.generationId}/blog`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "regenerate_section",
          sectionKey,
        }),
      });

      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        blog?: {
          title?: string;
          sections?: BlogSection[];
        };
      };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to regenerate section");
      }

      if (json.blog?.title) setTitle(json.blog.title);
      if (Array.isArray(json.blog?.sections)) setSections(json.blog.sections);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate section");
    } finally {
      setRunningSectionKey(null);
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      <GlassCard
        label="Sections"
        title="Blog structure"
        description="Edit and regenerate sections without leaving the blog editor."
        strong
        footer={
          <div className="flex flex-wrap gap-3">
            <GlassBadge tone="default">{sections.length} sections</GlassBadge>
            <GlassBadge tone="copper">Blog editor</GlassBadge>
          </div>
        }
      >
        <div className="grid gap-3">
          {sections.map((section) => {
            const selected = selectedSection?.key === section.key;
            const busy = runningSectionKey === section.key;

            return (
              <div
                key={section.key}
                className={cx(
                  "rounded-2xl border p-4",
                  selected ? glassTheme.border.copper : glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                  selected ? "ring-2 ring-sky-300/20" : "",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                      {section.title}
                    </div>
                    <div className={cx("text-xs", glassTheme.text.secondary)}>
                      {section.key}
                    </div>
                  </div>

                  <a
                    href={`?section=${section.key}`}
                    className={cx("text-xs", glassTheme.text.secondary)}
                  >
                    Edit
                  </a>
                </div>

                <div className={cx("mt-3 line-clamp-4 text-sm", glassTheme.text.secondary)}>
                  {section.body}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <GlassButton
                    variant="secondary"
                    onClick={() => void regenerateSection(section.key)}
                    disabled={busy}
                  >
                    {busy ? "Regenerating..." : "Regenerate section"}
                  </GlassButton>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <div className="space-y-5">
        <GlassCard
          label="Editor"
          title="Blog content"
          description="Section-based editing for long-form output."
          strong
          footer={
            <div className="flex flex-wrap gap-3">
              <GlassButton variant="primary" onClick={() => void saveBlog()} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save blog"}
              </GlassButton>
            </div>
          }
        >
          {error ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.copper,
                glassTheme.glass.panelSoft,
                glassTheme.text.copperSoft,
              )}
            >
              {error}
            </div>
          ) : null}

          <GlassInput
            label="Blog title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {selectedSection ? (
            <>
              <GlassInput
                label="Section heading"
                value={selectedSection.title}
                onChange={(e) =>
                  patchSection(selectedSection.key, { title: e.target.value })
                }
              />

              <GlassTextarea
                label="Section body"
                value={selectedSection.body}
                onChange={(e) =>
                  patchSection(selectedSection.key, { body: e.target.value })
                }
                className="min-h-[280px]"
              />
            </>
          ) : null}
        </GlassCard>

        <GlassCard
          label="Preview"
          title="Full blog preview"
          description="Live article preview built from the current sections."
          strong
        >
          <div className={cx("text-sm leading-7 whitespace-pre-wrap", glassTheme.text.primary)}>
            {bodyPreview}
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
