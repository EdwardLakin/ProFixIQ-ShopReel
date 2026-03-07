export async function publishToFacebook(videoId: string) {
  return { platform: "facebook", status: "queued", externalId: null, videoId };
}
