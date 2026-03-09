import type { ReactNode } from "react";

export default function ShopReelCard(props: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  const { title, eyebrow, children } = props;

  return (
    <section className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.16)] backdrop-blur-2xl">
      {eyebrow ? (
        <div className="mb-3 text-[12px] uppercase tracking-[0.32em] text-[#d7a07b]">
          {eyebrow}
        </div>
      ) : null}

      <h2 className="text-[1.9rem] font-semibold tracking-tight text-white">
        {title}
      </h2>

      <div className="mt-5">{children}</div>
    </section>
  );
}
