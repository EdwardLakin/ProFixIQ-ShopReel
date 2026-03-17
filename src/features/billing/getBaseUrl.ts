export function getBillingBaseUrl() {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL;

  if (explicit && explicit.trim().length > 0) {
    return explicit.trim();
  }

  const vercelUrl = process.env.VERCEL_URL;

  if (vercelUrl && vercelUrl.trim().length > 0) {
    return vercelUrl.startsWith("http")
      ? vercelUrl
      : `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}