export async function publishToYouTube(videoId: string) {
  return { platform: "youtube", status: "queued", externalId: null, videoId };
}
