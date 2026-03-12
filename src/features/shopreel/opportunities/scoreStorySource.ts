type StorySource = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  tags?: string[] | null;
};

export function scoreStorySource(source: StorySource) {
  let score = 50;

  const text =
    (source.title + " " + (source.description ?? "")).toLowerCase();

  if (text.includes("brake")) score += 20;
  if (text.includes("failure")) score += 20;
  if (text.includes("danger")) score += 20;
  if (text.includes("before")) score += 15;
  if (text.includes("after")) score += 15;

  if (source.kind === "inspection_completed") score += 10;
  if (source.kind === "repair_completed") score += 15;

  return Math.min(score, 100);
}
