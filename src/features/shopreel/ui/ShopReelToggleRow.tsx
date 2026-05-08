import type { ReactNode } from "react";

type ShopReelToggleRowProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function ShopReelToggleRow({
  title,
  description,
  children,
}: ShopReelToggleRowProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/22 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-white/50">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
