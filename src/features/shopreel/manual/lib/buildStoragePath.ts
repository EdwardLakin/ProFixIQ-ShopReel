function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function buildShopReelManualStoragePath(params: {
  shopId: string;
  assetId: string;
  fileName: string;
}) {
  const safe = sanitizeFileName(params.fileName);
  const stamp = Date.now();
  return `${params.shopId}/manual-assets/${params.assetId}/${stamp}-${safe}`;
}
