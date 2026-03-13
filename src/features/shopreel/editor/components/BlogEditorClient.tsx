"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassInput from "@/features/shopreel/ui/system/GlassInput";
import GlassTextarea from "@/features/shopreel/ui/system/GlassTextarea";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import type { BlogRewriteStyle } from "@/features/shopreel/creator/generateBlogSection";

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

type RewriteOption = {
  value: BlogRewriteStyle;
  label: string;
};

const REWRITE_OPTIONS: RewriteOption[] = [
  { value: "more_conversational", label: "Conversational" },
  { value: "more_technical", label: "Technical" },
  { value: "more_storytelling", label: "Storytelling" },
  { value: "more_persuasive", label: "Persuasive" },
  { value: "expand", label: "Expand" },
  { value: "shorter", label: "Shorten" },
  { value: "add_example", label: "Add example" },
  { value: "add_shop_floor_detail", label: "Add shop-floor detail" },
  { value: "stronger_hook", label: "Stronger hook" },
  { value: "simpler_explanation", label: "Simpler explanation" },
];

const DEFAULT_REWRITE_STYLE: BlogRewriteStyle = "more_conversational";

function rebuildBodyFromSections(sections: BlogSection[]) {
  return sections
    .map((section, index) => {
      if (index === 0) return section.body;
      return `## ${section.title}\n\n${section.body}`;
    })
    .join("\n\n");
}

function nextSectionKey() {
  return `section-${Date.now()}`;
}

export default function BlogEditorClient(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState(props.initialTitle);
  const [sections, setSections] = useState<BlogSection[]>(props.initialSections);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [runningSectionKey, setRunningSectionKey] = useState<string | null>(null);
  const [sectionRewriteStyles, setSectionRewriteStyles] = useState<Record<string, BlogRewriteStyle>>(
    () =>
      Object.fromEntries(
        props.initialSections.map((section) => [section.key, DEFAULT_REWRITE_STYLE]),
      ),
  );
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

  function setSectionRewriteStyle(sectionKey: string, style: BlogRewriteStyle) {
    setSectionRewriteStyles((current) => ({
      ...current,
      [sectionKey]: style,
    }));
  }

  function getSectionRewriteStyle(sectionKey: string) {
    return sectionRewriteStyles[sectionKey] ?? DEFAULT_REWRITE_STYLE;
  }

  function addSection() {
    const section: BlogSection = {
      key: nextSectionKey(),
      title: "New section",
      body: "",
    };

    setSections((current) => [...current, section]);
    setSectionRewriteStyle(section.key, DEFAULT_REWRITE_STYLE);
  }

  function deleteSection(sectionKey: string) {
    const target = sections.find((section) => section.key === sectionKey);
    const confirmed = window.confirm(
      `Delete section "${target?.title ?? sectionKey}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setSections((current) => current.filter((section) => section.key !== sectionKey));
    setSectionRewriteStyles((current) => {
      const next = { ...current };
      delete next[sectionKey];
      return next;
    });
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

  async function deleteGeneration() {
    const confirmed = window.confirm(
      "Delete this blog generation? This will remove this generated item.",
    );
    if (!confirmed) return;

    try {
      setError(null);
      setIsDeleting(true);

      const res = await fetch(`/api/shopreel/story-generations/${props.generationId}`, {
        method: "DELETE",
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to delete generation");
      }

      router.push("/shopreel/content");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete generation");
    } finally {
      setIsDeleting(false);
    }
  }

  async function runSectionAction(
    sectionKey: string,
    action: "regenerate_section" | "improve_section",
    rewriteStyle?: BlogRewriteStyle,
  ) {
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
          action,
          sectionKey,
          rewriteStyle,
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
        throw new Error(json.error ?? "Failed to rewrite section");
      }

      if (json.blog?.title) setTitle(json.blog.title);
      if (Array.isArray(json.blog?.sections)) setSections(json.blog.sections);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rewrite section");
    } finally {
      setRunningSectionKey(null);
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      <GlassCard
        label="Sections"
        title="Blog structure"
        description="Edit, rewrite, add, and delete sections without leaving the blog editor."
        strong
        footer={
          <div className="flex flex-wrap gap-3">
            <GlassBadge tone="default">{sections.length} sections</GlassBadge>
            <GlassBadge tone="copper">Blog editor</GlassBadge>
            <GlassButton variant="ghost" onClick={addSection}>
              Add section
            </GlassButton>
          </div>
        }
      >
        <div className="grid gap-3">
          {sections.map((section) => {
            const selected = selectedSection?.key === section.key;
            const busy = runningSectionKey === section.key;
            const rewriteStyle = getSectionRewriteStyle(section.key);

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

                  <div className="flex items-center gap-3">
                    <a
                      href={`?section=${section.key}`}
                      className={cx("text-xs", glassTheme.text.secondary)}
                    >
                      Edit
                    </a>
                    <button
                      type="button"
                      onClick={() => deleteSection(section.key)}
                      className={cx("text-xs", glassTheme.text.copperSoft)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className={cx("mt-3 line-clamp-4 text-sm", glassTheme.text.secondary)}>
                  {section.body}
                </div>

                <div className="mt-4 grid gap-2">
                  <select
                    value={rewriteStyle}
                    onChange={(e) =>
                      setSectionRewriteStyle(section.key, e.target.value as BlogRewriteStyle)
                    }
                    className={cx(
                      "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
                      glassTheme.text.primary,
                      glassTheme.glass.input,
                      glassTheme.border.softer,
                      "bg-transparent",
                    )}
                  >
                    {REWRITE_OPTIONS.map((option) => (
                      <option key={`${section.key}:${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex flex-wrap gap-2">
                    <GlassButton
                      variant="secondary"
                      onClick={() =>
                        void runSectionAction(
                          section.key,
                          "regenerate_section",
                          getSectionRewriteStyle(section.key),
                        )
                      }
                      disabled={busy}
                    >
                      {busy ? "Rewriting..." : "Rewrite with style"}
                    </GlassButton>

                    <GlassButton
                      variant="ghost"
                      onClick={() => void runSectionAction(section.key, "improve_section")}
                      disabled={busy}
                    >
                      {busy ? "Improving..." : "Improve writing"}
                    </GlassButton>
                  </div>
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
              <GlassButton variant="ghost" onClick={() => void deleteGeneration()} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete blog"}
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

              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <div className="space-y-2">
                  <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                    Rewrite with style
                  </div>
                  <select
                    value={getSectionRewriteStyle(selectedSection.key)}
                    onChange={(e) =>
                      setSectionRewriteStyle(
                        selectedSection.key,
                        e.target.value as BlogRewriteStyle,
                      )
                    }
                    className={cx(
                      "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
                      glassTheme.text.primary,
                      glassTheme.glass.input,
                      glassTheme.border.softer,
                      "bg-transparent",
                    )}
                  >
                    {REWRITE_OPTIONS.map((option) => (
                      <option key={`selected:${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <GlassButton
                    variant="secondary"
                    onClick={() =>
                      void runSectionAction(
                        selectedSection.key,
                        "regenerate_section",
                        getSectionRewriteStyle(selectedSection.key),
                      )
                    }
                    disabled={runningSectionKey === selectedSection.key}
                  >
                    {runningSectionKey === selectedSection.key ? "Rewriting..." : "Rewrite with style"}
                  </GlassButton>

                  <GlassButton
                    variant="ghost"
                    onClick={() => void runSectionAction(selectedSection.key, "improve_section")}
                    disabled={runningSectionKey === selectedSection.key}
                  >
                    {runningSectionKey === selectedSection.key ? "Improving..." : "Improve writing"}
                  </GlassButton>

                  <GlassButton
                    variant="ghost"
                    onClick={() => deleteSection(selectedSection.key)}
                  >
                    Delete section
                  </GlassButton>
                </div>
              </div>

              <GlassTextarea
                label="Section body"
                value={selectedSection.body}
                onChange={(e) =>
                  patchSection(selectedSection.key, { body: e.target.value })
                }
                className="min-h-[280px]"
              />

              <div
                className={cx(
                  "rounded-2xl border p-4 text-sm",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                  glassTheme.text.secondary,
                )}
              >
                <div className={cx("mb-2 text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                  Recommended rewrite options
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {REWRITE_OPTIONS.map((option) => (
                    <button
                      key={`recommend:${option.value}`}
                      type="button"
                      onClick={() => setSectionRewriteStyle(selectedSection.key, option.value)}
                      className={cx(
                        "rounded-xl border px-3 py-2 text-left text-sm transition",
                        getSectionRewriteStyle(selectedSection.key) === option.value
                          ? glassTheme.border.copper
                          : glassTheme.border.softer,
                        glassTheme.glass.panelSoft,
                        glassTheme.text.primary,
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary,
              )}
            >
              No section selected.
            </div>
          )}
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
