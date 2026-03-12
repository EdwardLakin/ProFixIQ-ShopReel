type StorySource = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  tags?: string[] | null;
  notes?: string[] | null;
};

export function scoreStorySource(source: StorySource) {
  let score = 40;

  const text = [
    source.title,
    source.description ?? "",
    ...(source.tags ?? []),
    ...(source.notes ?? []),
  ]
    .join(" ")
    .toLowerCase();

  if (text.includes("brake")) score += 20;
  if (text.includes("failure")) score += 20;
  if (text.includes("danger")) score += 20;
  if (text.includes("before")) score += 15;
  if (text.includes("after")) score += 15;
  if (text.includes("inspection")) score += 10;
  if (text.includes("repair")) score += 12;
  if (text.includes("worn")) score += 10;
  if (text.includes("scoring")) score += 8;
  if (text.includes("safety")) score += 12;

  if (source.kind === "inspection_completed") score += 10;
  if (source.kind === "repair_completed") score += 15;
  if (source.kind === "before_after") score += 18;
  if (source.kind === "educational_insight") score += 8;

  return Math.min(score, 100);
}
