export type ShopReelEditorOutputType = "video" | "blog" | "email" | "post" | "vlog";

export function normalizeEditorOutputType(value: unknown): ShopReelEditorOutputType {
  if (value === "blog" || value === "email" || value === "post" || value === "vlog") {
    return value;
  }
  return "video";
}

export function getEditorPath(outputType: unknown, generationId: string): string {
  const type = normalizeEditorOutputType(outputType);

  if (type === "blog") return `/shopreel/editor/blog/${generationId}`;
  if (type === "email") return `/shopreel/editor/email/${generationId}`;
  if (type === "post") return `/shopreel/editor/post/${generationId}`;
  if (type === "vlog") return `/shopreel/editor/vlog/${generationId}`;
  return `/shopreel/editor/video/${generationId}`;
}
