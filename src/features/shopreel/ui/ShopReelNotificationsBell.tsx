"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type NotificationResponse = { ok: boolean; unreadCount?: number };

export default function ShopReelNotificationsBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const res = await fetch("/api/shopreel/notifications", { cache: "no-store" });
      const payload = (await res.json()) as NotificationResponse;
      if (active && payload.ok) {
        setUnreadCount(payload.unreadCount ?? 0);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Link href="/shopreel/notifications" className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-white/80 hover:bg-white/[0.09] hover:text-white" aria-label="Notifications">
      <span aria-hidden>🔔</span>
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>
      ) : null}
    </Link>
  );
}
