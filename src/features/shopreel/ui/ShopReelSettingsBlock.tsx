import type { ReactNode } from "react";

export default function ShopReelSettingsBlock(props: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { title, subtitle, children } = props;

  return (
    <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(6,12,22,0.92),rgba(7,15,28,0.82))] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.22)]">
      <div className="text-lg font-semibold tracking-tight text-white">
        {title}
      </div>
      {subtitle ? (
        <p className="mt-2 text-sm leading-6 text-white/60">{subtitle}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </div>
  );
}
