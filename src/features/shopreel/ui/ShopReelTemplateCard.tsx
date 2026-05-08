import type { ReactNode } from "react";

type ShopReelTemplateCardProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  children?: ReactNode;
  action?: ReactNode;
};

export default function ShopReelTemplateCard({
  title,
  description,
  eyebrow,
  children,
  action,
}: ShopReelTemplateCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_54px_rgba(0,0,0,.30)] backdrop-blur-2xl transition duration-200 hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-white/[0.07]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,.14),transparent_34%),radial-gradient(circle_at_100%_10%,rgba(34,211,238,.10),transparent_34%)] opacity-70" />
      <div className="mb-4 h-24 rounded-[1.25rem] border border-white/10 bg-black/30 p-3">
        <div className="h-full rounded-2xl bg-[linear-gradient(135deg,rgba(124,58,237,.28),rgba(34,211,238,.10)),radial-gradient(circle_at_70%_20%,rgba(255,255,255,.22),transparent_24%)]" />
      </div>

      {eyebrow ? (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-200/66">
          {eyebrow}
        </p>
      ) : null}

      <h3 className="text-lg font-semibold tracking-[-0.03em] text-white">{title}</h3>
      {description ? <p className="mt-2 text-sm leading-6 text-white/58">{description}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
