import ShopReelShell from "@/features/shopreel/ui/ShopReelShell";
import ShopReelCard from "@/features/shopreel/ui/ShopReelCard";
import ShopReelBadge from "@/features/shopreel/ui/ShopReelBadge";
import ShopReelEmpty from "@/features/shopreel/ui/ShopReelEmpty";
import ShopReelKeyValue from "@/features/shopreel/ui/ShopReelKeyValue";
import ShopReelListItem from "@/features/shopreel/ui/ShopReelListItem";
import ShopReelSectionGrid from "@/features/shopreel/ui/ShopReelSectionGrid";
import { getBaseUrl } from "@/features/shopreel/lib/getBaseUrl";

const DEFAULT_SHOP_ID = "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

type Suggestion = {
  sourceType?: string;
  sourceId?: string;
  workOrderId?: string | null;
  title?: string;
  trigger?: string;
  viralScore?: number;
  reason?: string;
  prompt?: string;
};

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
    return (await response.json()) as { suggestions?: Suggestion[] } | null;
  } catch {
    return null;
  }
}

export default async function ShopReelOpportunitiesPage() {
  const data = await postJson("/api/shopreel/suggestions", {
    shopId: DEFAULT_SHOP_ID,
  });

  const suggestions = Array.isArray(data?.suggestions) ? data!.suggestions : [];

  return (
    <ShopReelShell
      title="Opportunities"
      subtitle="High-value repair stories, inspection highlights, and viral moments detected from shop activity."
    >
      <ShopReelCard title="Detected Opportunities" eyebrow="Live Feed">
        {suggestions.length === 0 ? (
          <ShopReelEmpty message="No opportunities detected yet for this shop." />
        ) : (
          <ShopReelSectionGrid>
            {suggestions.map((item, index) => (
              <ShopReelListItem
                key={`${item.sourceId ?? "op"}-${index}`}
                title={item.title ?? "Untitled opportunity"}
                subtitle={item.prompt ?? "AI-generated opportunity prompt"}
                right={
                  <div className="flex flex-wrap gap-2 justify-end">
                    <ShopReelBadge tone="copper">
                      Score {item.viralScore ?? 0}
                    </ShopReelBadge>
                    <ShopReelBadge tone="cyan">
                      {item.sourceType ?? "unknown"}
                    </ShopReelBadge>
                  </div>
                }
              >
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <ShopReelKeyValue label="Trigger" value={item.trigger} />
                  <ShopReelKeyValue label="Reason" value={item.reason} />
                  <ShopReelKeyValue label="Work Order" value={item.workOrderId} />
                  <ShopReelKeyValue label="Source ID" value={item.sourceId} />
                </div>
              </ShopReelListItem>
            ))}
          </ShopReelSectionGrid>
        )}
      </ShopReelCard>
    </ShopReelShell>
  );
}
