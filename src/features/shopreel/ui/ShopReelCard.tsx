import type { ReactNode } from "react";

export default function ShopReelCard(props: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  const { title, eyebrow, children } = props;

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      {eyebrow ? (
        <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.3em] text-cyan-300/85">
          {eyebrow}
        </div>
      ) : null}

      <h2 className="text-2xl font-semibold tracking-tight text-white">
        {title}
      </h2>

      <div className="mt-5">{children}</div>
    </section>
  );
}