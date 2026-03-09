import type { ReactNode } from "react";

type Tone = "neutral" | "copper" | "cyan" | "green";

export default function ShopReelBadge(props: {
  children: ReactNode;
  tone?: Tone;
}) {
  const { children, tone = "neutral" } = props;

  const toneClass =
    tone === "copper"
      ? "border-[color:rgba(193,102,59,0.35)] bg-[rgba(193,102,59,0.12)] text-[#e1b08b]"
      : tone === "cyan"
        ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-200"
        : tone === "green"
          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 bg-white/[0.05] text-white/72";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${toneClass}`}
    >
      {children}
    </span>
  );
}
