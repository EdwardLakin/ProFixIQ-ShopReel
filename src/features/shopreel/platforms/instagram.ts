export async function publishToInstagram(videoId: string) {
  return { platform: "instagram", status: "queued", externalId: null, videoId };
}
