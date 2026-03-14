export type ContentPerformanceInput = {
  views?: number
  likes?: number
  shares?: number
  comments?: number
  watchTime?: number
}

export function scoreContentPerformance(input: ContentPerformanceInput) {
  const views = input.views ?? 0
  const likes = input.likes ?? 0
  const shares = input.shares ?? 0
  const comments = input.comments ?? 0

  if (views === 0) return 0

  const engagement =
    (likes * 1.2 +
      shares * 2.0 +
      comments * 1.5) /
    views

  return Math.min(1, engagement * 10)
}
