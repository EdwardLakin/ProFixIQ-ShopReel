export type VideoMetrics = {
  views: number
  likes: number
  shares: number
  leads: number
}

export async function trackMetrics(videoId: string, metrics: VideoMetrics) {
  console.log("Tracking metrics for", videoId)

  // future:
  // write to video_metrics table

  return true
}
