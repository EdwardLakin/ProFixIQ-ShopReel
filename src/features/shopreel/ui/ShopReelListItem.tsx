import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
};

export default function ShopReelListItem({
  title,
  subtitle,
  right,
  children,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-medium text-white">{title}</div>
          {subtitle ? <div className="mt-1 text-sm text-white/55">{subtitle}</div> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
