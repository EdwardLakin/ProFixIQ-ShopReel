import { generateContentCalendar } from "../calendar/generateContentCalendar";
import { generateHooks } from "../hooks/generateHooks";

export async function runShopReelAutopilot(shopId: string) {

  const calendar = await generateContentCalendar("Auto Repair Shop");

  const enriched = [];

  for (const item of calendar) {
    const hooks = await generateHooks(item.content_type);
    enriched.push({
      ...item,
      hookOptions: hooks
    });
  }

  return enriched;
}
