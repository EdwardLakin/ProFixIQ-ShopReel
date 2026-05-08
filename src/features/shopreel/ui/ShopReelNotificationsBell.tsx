"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type NotificationResponse = { ok: boolean; unreadCount?: number };

export default function ShopReelNotificationsBell(props: {
  collapsed?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const { collapsed = true, onClick, className } = props;
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
    <Link
      href="/shopreel/notifications"
      onClick={onClick}
      className={`relative rounded-xl border border-white/15 bg-white/[0.04] text-white/80 hover:bg-white/[0.09] hover:text-white ${collapsed ? "inline-flex h-10 w-full items-center justify-center" : "flex h-10 items-center gap-2.5 px-2.5 text-sm font-medium"} ${className ?? ""}`}
      aria-label="Notifications"
      title={collapsed ? "Notifications" : undefined}
    >
      <span aria-hidden className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-white/10 text-xs text-white/85">🔔</span>
      {!collapsed ? <span>Notifications</span> : null}
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>
      ) : null}
    </Link>
  );
}
