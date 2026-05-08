import Link from "next/link";

export default function ShopReelNotificationsBell() {
  return (
    <Link
      href="/shopreel/notifications"
      aria-label="Open notifications"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-sm text-white/72 shadow-[0_14px_38px_rgba(0,0,0,.28)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.09] hover:text-white"
    >
      <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.9)]" />
      🔔
    </Link>
  );
}
