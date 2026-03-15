import { normalizeEditorOutputType } from "./editorPaths";

export function getReviewPath(outputType: unknown, generationId: string): string {
  const type = normalizeEditorOutputType(outputType);

  if (type === "blog") return `/shopreel/review/blog/${generationId}`;
  if (type === "vlog") return `/shopreel/review/vlog/${generationId}`;
  return `/shopreel/generations/${generationId}`;
}
