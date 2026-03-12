"use client";

import { useMemo, useState } from "react";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassInput from "@/features/shopreel/ui/system/GlassInput";
import GlassTextarea from "@/features/shopreel/ui/system/GlassTextarea";
import GlassSelect from "@/features/shopreel/ui/system/GlassSelect";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

type UploadFileMeta = {
  file: File;
  fileType: "image" | "video";
};

type GeneratedManualResponse = {
  ok: true;
  generated: {
    storySource: { id: string; title: string; kind: string };
    draft: { id: string; title: string };
    contentPiece: { id: string; title: string };
  };
  renderJob: { id: string; status: string } | null;
};

function inferAssetType(files: UploadFileMeta[]): "image" | "video" | "mixed" {
  const hasImage = files.some((f) => f.fileType === "image");
  const hasVideo = files.some((f) => f.fileType === "video");

  if (hasImage && hasVideo) return "mixed";
  if (hasVideo) return "video";
  return "image";
}

function detectFileType(file: File): "image" | "video" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  throw new Error(`Unsupported file type: ${file.type}`);
}

export default function ManualUploadClient() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [contentGoal, setContentGoal] = useState("repair_story");
  const [files, setFiles] = useState<UploadFileMeta[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assetType = useMemo(() => {
    if (!files.length) return "image";
    return inferAssetType(files);
  }, [files]);

  function onSelectFiles(fileList: FileList | null) {
    if (!fileList?.length) return;

    const next: UploadFileMeta[] = [];

    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) continue;

      next.push({
        file,
        fileType: detectFileType(file),
      });
    }

    setFiles(next);
    setError(null);
  }

  async function uploadOne(file: File, assetId: string) {
    const signRes = await fetch("/api/shopreel/manual-assets/sign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assetId,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      }),
    });

    const signJson = await signRes.json();

    if (!signRes.ok) {
      throw new Error(signJson.error ?? "Failed to sign upload");
    }

    const { path, token } = signJson;

    const uploadRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/shopreel-media/${path}?token=${token}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          "x-upsert": "false",
        },
        body: file,
      },
    );

    if (!uploadRes.ok) {
      throw new Error(`Upload failed for ${file.name}`);
    }

    return {
      filePath: path,
      fileName: file.name,
      fileType: detectFileType(file),
      mimeType: file.type,
      sizeBytes: file.size,
    };
  }

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      setError(null);
      setResult(null);

      if (!title.trim()) throw new Error("Title is required");
      if (!files.length) throw new Error("Add at least one file");

      const createRes = await fetch("/api/shopreel/manual-assets/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          note,
          assetType,
          contentGoal,
          platformTargets: [],
          tags: [],
        }),
      });

      const createJson = await createRes.json();

      if (!createRes.ok) {
        throw new Error(createJson.error ?? "Failed to create asset");
      }

      const { assetId } = createJson;
      const uploadedFiles = [];

      for (const item of files) {
        uploadedFiles.push(await uploadOne(item.file, assetId));
      }

      const completeRes = await fetch("/api/shopreel/manual-assets/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assetId,
          files: uploadedFiles.map((f, index) => ({
            ...f,
            sortOrder: index,
          })),
        }),
      });

      const completeJson = await completeRes.json();

      if (!completeRes.ok) {
        throw new Error(completeJson.error ?? "Finalize failed");
      }

      const generateRes = await fetch("/api/shopreel/manual/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assetId,
          createRenderJobNow: true,
        }),
      });

      const generateJson = (await generateRes.json()) as
        | GeneratedManualResponse
        | { ok?: false; error?: string };

      if (!generateRes.ok || !("ok" in generateJson) || !generateJson.ok) {
        throw new Error(("error" in generateJson && generateJson.error) || "Generation failed");
      }

      setResult(
        `Story source ${generateJson.generated.storySource.id} created • Content piece ${generateJson.generated.contentPiece.id} created${
          generateJson.renderJob ? ` • Render job ${generateJson.renderJob.id}` : ""
        }`,
      );

      setTitle("");
      setDescription("");
      setNote("");
      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <GlassCard
        label="Upload Content"
        title="Manual media intake"
        description="Add photos or videos and generate a Story Source, Story Draft, Content Piece, and Render Job."
        strong
      >
        <div className="grid gap-4 md:grid-cols-2">
          <GlassInput
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <GlassSelect
            label="Content goal"
            value={contentGoal}
            onChange={(e) => setContentGoal(e.target.value)}
            options={[
              { value: "repair_story", label: "Repair story" },
              { value: "before_after", label: "Before / after" },
              { value: "educational_tip", label: "Educational tip" },
              { value: "promotion", label: "Promotion" },
            ]}
          />
        </div>

        <GlassTextarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <GlassTextarea
          label="Notes for AI"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div
          className={cx(
            "rounded-2xl border p-4",
            glassTheme.border.copper,
            glassTheme.glass.panelSoft,
          )}
        >
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => onSelectFiles(e.target.files)}
            className={cx("block w-full text-sm", glassTheme.text.secondary)}
          />

          {files.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <GlassBadge tone="copper">{assetType}</GlassBadge>
              <GlassBadge tone="default">{files.length} files</GlassBadge>
            </div>
          ) : null}
        </div>

        {error ? (
          <div
            className={cx(
              "rounded-2xl border px-4 py-3 text-sm",
              glassTheme.border.copper,
              glassTheme.glass.panelSoft,
              glassTheme.text.copperSoft,
            )}
          >
            {error}
          </div>
        ) : null}

        {result ? (
          <div
            className={cx(
              "rounded-2xl border px-4 py-3 text-sm",
              glassTheme.border.copper,
              glassTheme.glass.panelSoft,
              glassTheme.text.primary,
            )}
          >
            {result}
          </div>
        ) : null}

        <GlassButton
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Uploading and generating..." : "Upload content"}
        </GlassButton>
      </GlassCard>
    </div>
  );
}
