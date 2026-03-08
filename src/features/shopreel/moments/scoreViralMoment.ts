export type ViralMomentScore = {
  score: number
  reason: string
}

const VIRAL_KEYWORDS: Record<string, number> = {
  transmission: 95,
  engine: 95,
  blown: 92,
  seized: 90,
  brake: 88,
  coolant: 85,
  overheating: 90,
  suspension: 80,
  oil: 70,
  filter: 60
}

export function scoreViralMoment(text: string): ViralMomentScore {

  const lower = text.toLowerCase()

  let score = 50
  let reason = "standard repair"

  for (const keyword of Object.keys(VIRAL_KEYWORDS)) {
    if (lower.includes(keyword)) {
      score = VIRAL_KEYWORDS[keyword]
      reason = keyword
      break
    }
  }

  return { score, reason }
}
