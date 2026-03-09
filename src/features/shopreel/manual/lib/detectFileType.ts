export function detectFileTypeFromMime(mimeType: string): "image" | "video" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  throw new Error(`Unsupported mime type: ${mimeType}`);
}
