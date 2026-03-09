import type { ReactNode } from "react";

export default function ShopReelListItem(props: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  const { title, subtitle, right, children } = props;

  return (
    <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.12)] backdrop-blur-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-lg font-semibold tracking-tight text-white">
            {title}
          </div>
          {subtitle ? (
            <p className="mt-2 text-sm leading-6 text-white/64">{subtitle}</p>
          ) : null}
        </div>

        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}
