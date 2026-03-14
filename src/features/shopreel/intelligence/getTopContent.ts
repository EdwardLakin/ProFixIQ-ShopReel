import { calculateContentScores } from "./calculateContentScores";

export async function getTopContent(shopId: string) {
  const scores = await calculateContentScores(shopId);

  return scores.slice(0, 10);
}
