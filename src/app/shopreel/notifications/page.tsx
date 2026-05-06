import Link from "next/link";
import { listNotificationsForCurrentUser } from "@/features/shopreel/notifications/server";

export const dynamic = "force-dynamic";

export default async function ShopReelNotificationsPage() {
  const { items, unreadCount } = await listNotificationsForCurrentUser(100);

  return (
    <section className="px-4 pb-10 pt-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Notifications</h1>
          <p className="text-sm text-white/70">Unread: {unreadCount}</p>
        </div>
        <form action="/api/shopreel/notifications/mark-all-read" method="post">
          <button className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/85 hover:bg-white/10" type="submit">Mark all read</button>
        </form>
      </div>
      <div className="space-y-3">
        {items.length === 0 ? <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">No notifications yet.</p> : null}
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                {item.body ? <p className="mt-1 text-sm text-white/75">{item.body}</p> : null}
                <p className="mt-1 text-xs text-white/50">{new Date(item.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                {item.action_href ? <Link href={item.action_href} className="rounded-md border border-cyan-300/30 px-2 py-1 text-xs text-cyan-200">{item.action_label ?? "Open"}</Link> : null}
                {item.status === "unread" ? (
                  <form action={`/api/shopreel/notifications/${item.id}/read`} method="post">
                    <button type="submit" className="rounded-md border border-white/20 px-2 py-1 text-xs text-white/80">Mark read</button>
                  </form>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
