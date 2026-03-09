import ShopReelShell from "@/features/shopreel/ui/ShopReelShell";
import ShopReelCard from "@/features/shopreel/ui/ShopReelCard";
import ShopReelBadge from "@/features/shopreel/ui/ShopReelBadge";
import ShopReelEmpty from "@/features/shopreel/ui/ShopReelEmpty";
import ShopReelKeyValue from "@/features/shopreel/ui/ShopReelKeyValue";
import ShopReelListItem from "@/features/shopreel/ui/ShopReelListItem";
import { getBaseUrl } from "@/features/shopreel/lib/getBaseUrl";

const DEFAULT_SHOP_ID = "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

type SignalRow = {
  content_type?: string;
  avg_engagement_score?: number;
  total_views?: number;
  total_leads?: number;
  posts_generated?: number;
  last_updated?: string | null;
};

type MemoryResponse = {
  result?: {
    updatedAt?: string;
    topContentTypes?: SignalRow[];
  };
};

type SignalsResponse = {
  result?: {
    rows?: SignalRow[];
  };
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
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

export default async function ShopReelAnalyticsPage() {
  const signalsData = (await postJson("/api/shopreel/signals", {
    shopId: DEFAULT_SHOP_ID,
  })) as SignalsResponse | null;

  const memoryData = (await postJson("/api/shopreel/memory", {
    shopId: DEFAULT_SHOP_ID,
  })) as MemoryResponse | null;

  const signalRows = Array.isArray(signalsData?.result?.rows)
    ? signalsData!.result!.rows!
    : [];

  const memoryRows = Array.isArray(memoryData?.result?.topContentTypes)
    ? memoryData!.result!.topContentTypes!
    : [];

  return (
    <ShopReelShell
      title="Analytics"
      subtitle="Learning signals, strategy memory, and performance feedback loop."
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <ShopReelCard title="Learning Signals" eyebrow="Feedback Loop">
          {signalRows.length === 0 ? (
            <ShopReelEmpty message="No learning signals available yet." />
          ) : (
            <div className="grid gap-4">
              {signalRows.map((row, index) => (
                <ShopReelListItem
                  key={`${row.content_type ?? "signal"}-${index}`}
                  title={row.content_type ?? "Unknown content type"}
                  right={<ShopReelBadge tone="copper">Signal</ShopReelBadge>}
                >
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <ShopReelKeyValue label="Avg Engagement" value={row.avg_engagement_score} />
                    <ShopReelKeyValue label="Views" value={row.total_views} />
                    <ShopReelKeyValue label="Leads" value={row.total_leads} />
                    <ShopReelKeyValue label="Posts" value={row.posts_generated} />
                  </div>
                </ShopReelListItem>
              ))}
            </div>
          )}
        </ShopReelCard>

        <ShopReelCard title="Marketing Memory" eyebrow="Strategy Memory">
          {memoryRows.length === 0 ? (
            <ShopReelEmpty message="No marketing memory saved yet." />
          ) : (
            <div className="grid gap-4">
              {memoryRows.map((row, index) => (
                <ShopReelListItem
                  key={`${row.content_type ?? "memory"}-${index}`}
                  title={row.content_type ?? "Unknown content type"}
                  subtitle={`Updated: ${row.last_updated ?? memoryData?.result?.updatedAt ?? "—"}`}
                  right={<ShopReelBadge tone="cyan">Memory</ShopReelBadge>}
                >
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <ShopReelKeyValue label="Avg Engagement" value={row.avg_engagement_score} />
                    <ShopReelKeyValue label="Views" value={row.total_views} />
                    <ShopReelKeyValue label="Leads" value={row.total_leads} />
                    <ShopReelKeyValue label="Posts" value={row.posts_generated} />
                  </div>
                </ShopReelListItem>
              ))}
            </div>
          )}
        </ShopReelCard>
      </div>
    </ShopReelShell>
  );
}
