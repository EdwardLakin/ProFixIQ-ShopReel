import type { ReactNode } from "react";

export default function ShopReelCard(props: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  const { title, eyebrow, children } = props;

  return (
    <section className="rounded-[28px] border border-[rgba(148,163,184,0.16)] bg-[linear-gradient(180deg,rgba(18,27,46,0.78),rgba(10,16,30,0.92))] p-6 shadow-[0_16px_44px_rgba(0,0,0,0.30)] backdrop-blur-xl">
      {eyebrow ? (
        <div className="mb-3 text-[12px] uppercase tracking-[0.32em] text-[#d7a07b]">
          {eyebrow}
        </div>
      ) : null}

      <h2 className="text-[2rem] font-semibold tracking-tight text-white">
        {title}
      </h2>

      <div className="mt-5">{children}</div>
    </section>
  );
}
