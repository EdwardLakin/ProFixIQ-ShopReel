export function formatShopReelStatus(value: string | null | undefined): string {
  const normalized = (value ?? "").trim().toLowerCase();

  switch (normalized) {
    case "queued":
      return "Queued";
    case "processing":
      return "Generating";
    case "completed":
      return "Ready";
    case "ready":
      return "Ready";
    case "published":
      return "Published";
    case "publishing":
      return "Publishing";
    case "failed":
      return "Failed";
    case "draft":
      return "Draft";
    case "running":
      return "Active";
    case "active":
      return "Active";
    default:
      if (!normalized) return "Unknown";
      return normalized.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

export function formatWorkflowLabel(value: string | null | undefined): string {
  const normalized = (value ?? "").trim().toLowerCase();

  switch (normalized) {
    case "render queue":
      return "Generation Queue";
    case "render":
      return "Generate";
    case "creator requests":
      return "AI Requests";
    case "published":
      return "Published";
    case "content":
      return "Library";
    default:
      if (!normalized) return "Unknown";
      return normalized.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
