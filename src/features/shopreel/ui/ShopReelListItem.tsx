import type { ReactNode } from "react";

type ShopReelListItemProps = {
  title: string;
  description?: string;
  meta?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
};

export default function ShopReelListItem({
  title,
  description,
  meta,
  action,
  children,
}: ShopReelListItemProps) {
  return (
    <div className="group relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4 shadow-[0_12px_36px_rgba(0,0,0,.22)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/24 hover:bg-white/[0.06]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {meta ? <div className="mb-2">{meta}</div> : null}
          <h3 className="truncate text-sm font-semibold tracking-[-0.015em] text-white">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-white/56">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
