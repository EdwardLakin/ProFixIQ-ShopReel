
export const SHOPREEL_MANUAL_UPLOAD_MAX_BYTES = 52_428_800;

export const SHOPREEL_MANUAL_UPLOAD_MAX_LABEL = "50 MB";

export function formatBytes(bytes: number): string {

  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"] as const;

  let value = bytes;

  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {

    value /= 1024;

    unitIndex += 1;

  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;

}

