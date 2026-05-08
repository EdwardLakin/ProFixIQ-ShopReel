import type { ReactNode } from "react";

type ShopReelSettingsBlockProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function ShopReelSettingsBlock({
  title,
  description,
  children,
}: ShopReelSettingsBlockProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.65rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_16px_52px_rgba(0,0,0,.28)] backdrop-blur-2xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/22 to-transparent" />
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-[-0.02em] text-white">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-white/56">{description}</p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
