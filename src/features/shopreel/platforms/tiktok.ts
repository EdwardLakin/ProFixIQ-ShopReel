export async function publishToTikTok(videoId: string) {
  return { platform: "tiktok", status: "queued", externalId: null, videoId };
}
