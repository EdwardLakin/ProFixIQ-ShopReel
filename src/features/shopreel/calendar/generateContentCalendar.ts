import { openai } from "@/features/ai/server/openai";

type CalendarItem = {
  day: number;
  videoIdea: string;
  contentType: string;
  hook: string;
  cta: string;
};

function fallbackCalendar(shopName: string): CalendarItem[] {
  return [
    {
      day: 1,
      videoIdea: `${shopName} workflow demo`,
      contentType: "workflow_demo",
      hook: "See how this vehicle moved through the shop without the usual chaos.",
      cta: "Follow for more real repair and inspection content.",
    },
    {
      day: 2,
      videoIdea: "Inspection highlight",
      contentType: "inspection_highlight",
      hook: "You won’t believe what we found during this inspection.",
      cta: "Follow for more real repair and inspection content.",
    },
    {
      day: 3,
      videoIdea: "Repair story",
      contentType: "repair_story",
      hook: "Customer thought it was small. It wasn’t.",
      cta: "Follow for more real repair and inspection content.",
    },
    {
      day: 4,
      videoIdea: "Before and after",
      contentType: "before_after",
      hook: "From worn out to road-ready.",
      cta: "Follow for more real repair and inspection content.",
    },
    {
      day: 5,
      videoIdea: "Educational tip",
      contentType: "educational_tip",
      hook: "Here’s what every driver should know about this issue.",
      cta: "Follow for more real repair and inspection content.",
    },
    {
      day: 6,
      videoIdea: "How-to explainer",
      contentType: "how_to",
      hook: "Here’s how we approach this kind of repair in the shop.",
      cta: "Follow for more real repair and inspection content.",
    },
    {
      day: 7,
      videoIdea: "Vehicle findings",
      contentType: "findings_on_vehicle",
      hook: "Here’s what we found on this vehicle today.",
      cta: "Follow for more real repair and inspection content.",
    },
  ];
}

function extractJsonArray(text: string): string | null {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    return null;
  }
  return text.slice(start, end + 1);
}

export async function generateContentCalendar(
  shopName: string,
): Promise<CalendarItem[]> {
  const prompt = `
Create a 7 day content calendar for an automotive repair shop.

Return ONLY a valid JSON array.
Each item must have:
- day
- videoIdea
- contentType
- hook
- cta
`;

  try {
    const res = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const rawText =
      typeof res.output_text === "string" ? res.output_text.trim() : "";

    if (!rawText) {
      return fallbackCalendar(shopName);
    }

    const jsonText = extractJsonArray(rawText) ?? rawText;
    const parsed = JSON.parse(jsonText) as unknown;

    if (!Array.isArray(parsed)) {
      return fallbackCalendar(shopName);
    }

    const cleaned: CalendarItem[] = parsed
      .filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null,
      )
      .map((item, index) => ({
        day:
          typeof item.day === "number" && Number.isFinite(item.day)
            ? item.day
            : index + 1,
        videoIdea:
          typeof item.videoIdea === "string" && item.videoIdea.length > 0
            ? item.videoIdea
            : `${shopName} content idea ${index + 1}`,
        contentType:
          typeof item.contentType === "string" && item.contentType.length > 0
            ? item.contentType
            : "workflow_demo",
        hook:
          typeof item.hook === "string" && item.hook.length > 0
            ? item.hook
            : "See what happened in the shop today.",
        cta:
          typeof item.cta === "string" && item.cta.length > 0
            ? item.cta
            : "Follow for more real repair and inspection content.",
      }))
      .slice(0, 7);

    return cleaned.length > 0 ? cleaned : fallbackCalendar(shopName);
  } catch {
    return fallbackCalendar(shopName);
  }
}
