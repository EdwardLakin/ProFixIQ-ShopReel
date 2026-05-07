export type VideoJobStatus = "queued" | "submitted" | "processing" | "rendering" | "completed" | "failed";

export function normalizeVideoJobStatus(status: string | null | undefined): VideoJobStatus {
  if (!status) return "queued";
  const value = status.toLowerCase();
  if (value === "queued" || value === "pending") return "queued";
  if (value === "submitted") return "submitted";
  if (value === "processing" || value === "in_progress") return "processing";
  if (value === "rendering") return "rendering";
  if (value === "completed" || value === "ready" || value === "succeeded") return "completed";
  if (value === "failed" || value === "error") return "failed";
  return "processing";
}
