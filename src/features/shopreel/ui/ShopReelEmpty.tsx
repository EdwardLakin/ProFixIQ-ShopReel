import type { ReactNode } from "react";

type ShopReelEmptyProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function ShopReelEmpty({
  title,
  description,
  action,
}: ShopReelEmptyProps) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-dashed border-white/16 bg-white/[0.035] p-6 shadow-[0_18px_60px_rgba(0,0,0,.28)] backdrop-blur-2xl">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_0%,rgba(124,58,237,.16),transparent_34%),radial-gradient(circle_at_92%_20%,rgba(34,211,238,.10),transparent_32%)]" />
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.065] text-lg text-cyan-100 shadow-xl">
        ✦
      </div>
      <h3 className="text-lg font-semibold tracking-[-0.025em] text-white">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/58">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
