import ShopReelShell from "@/features/shopreel/ui/ShopReelShell";
import ShopReelCard from "@/features/shopreel/ui/ShopReelCard";
import ShopReelBadge from "@/features/shopreel/ui/ShopReelBadge";
import ShopReelEmpty from "@/features/shopreel/ui/ShopReelEmpty";
import ShopReelKeyValue from "@/features/shopreel/ui/ShopReelKeyValue";
import ShopReelListItem from "@/features/shopreel/ui/ShopReelListItem";
import ShopReelSectionGrid from "@/features/shopreel/ui/ShopReelSectionGrid";
import { getBaseUrl } from "@/features/shopreel/lib/getBaseUrl";

const DEFAULT_SHOP_ID = "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

type CalendarItem = {
  day?: number;
  videoIdea?: string;
  title?: string;
  contentType?: string;
  hook?: string;
  cta?: string;
};

type CalendarResponse =
  | {
      result?: CalendarItem[];
      items?: CalendarItem[];
    }
  | null;

async function postJson(path: string, body: unknown) {
  const base = getBaseUrl();

  try {
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) return null;
    return (await response.json()) as CalendarResponse;
  } catch {
    return null;
  }
}

export default async function ShopReelCalendarPage() {
  const data = await postJson("/api/shopreel/calendar", {
    shopId: DEFAULT_SHOP_ID,
  });

  const items = Array.isArray(data?.result)
    ? data!.result
    : Array.isArray(data?.items)
      ? data!.items
      : [];

  return (
    <ShopReelShell
      title="Calendar"
      subtitle="Generated posting plan and calendar structure for the current shop."
    >
      <ShopReelCard title="Calendar Output" eyebrow="Planner">
        {items.length === 0 ? (
          <ShopReelEmpty message="No calendar items generated yet." />
        ) : (
          <ShopReelSectionGrid>
            {items.map((item, index) => (
              <ShopReelListItem
                key={`day-${item.day ?? index + 1}`}
                title={item.videoIdea ?? item.title ?? `Day ${item.day ?? index + 1}`}
                subtitle={item.hook ?? "No hook generated yet."}
                right={
                  <ShopReelBadge tone="copper">
                    Day {item.day ?? index + 1}
                  </ShopReelBadge>
                }
              >
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <ShopReelKeyValue label="Content Type" value={item.contentType} />
                  <ShopReelKeyValue label="CTA" value={item.cta} />
                  <div className="flex items-start">
                    <ShopReelBadge tone="cyan">
                      {item.contentType ?? "planned"}
                    </ShopReelBadge>
                  </div>
                </div>
              </ShopReelListItem>
            ))}
          </ShopReelSectionGrid>
        )}
      </ShopReelCard>
    </ShopReelShell>
  );
}
