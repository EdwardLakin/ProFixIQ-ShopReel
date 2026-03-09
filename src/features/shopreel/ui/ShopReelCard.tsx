import type { ReactNode } from "react";

export default function ShopReelCard(props: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  const { title, eyebrow, children } = props;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,22,39,0.86),rgba(9,14,26,0.94))] p-6 shadow-[0_16px_44px_rgba(0,0,0,0.30)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(193,102,59,0.06),transparent_34%)]" />
      <div className="relative">
        {eyebrow ? (
          <div className="mb-3 text-[12px] uppercase tracking-[0.32em] text-[#d7a07b]">
            {eyebrow}
          </div>
        ) : null}

        <h2 className="text-[1.9rem] font-semibold tracking-tight text-white">
          {title}
        </h2>

        <div className="mt-5">{children}</div>
      </div>
    </section>
  );
}
