import { getDashboardData } from "@/features/shopreel/dashboard/getDashboardData";
import RunAutomationButton from "@/features/shopreel/dashboard/components/RunAutomationButton";

export default async function ShopReelDashboard() {
  const shopId = "demo"; // replace later with session shop
  const data = await getDashboardData(shopId);

  return (
    <div className="p-8 space-y-10">

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">ShopReel Command Center</h1>

        <RunAutomationButton shopId={shopId} />
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Content</h2>
        <ul className="space-y-2">
          {data.recentContent.map((c: any) => (
            <li key={c.id} className="border p-3 rounded">
              {c.title ?? "Untitled"}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Upcoming Posts</h2>
        <ul className="space-y-2">
          {data.upcoming.map((c: any) => (
            <li key={c.id} className="border p-3 rounded">
              {c.scheduled_for}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Analytics Events</h2>
        <p>Total events: {data.analytics.length}</p>
      </section>

    </div>
  );
}