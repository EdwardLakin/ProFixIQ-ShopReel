import type { ReactNode } from "react";

type Tone = "neutral" | "copper" | "cyan" | "green" | "red";

export default function ShopReelBadge(props: {
  children: ReactNode;
  tone?: Tone;
}) {
  const { children, tone = "neutral" } = props;

  const toneClass =
    tone === "copper"
      ? "border-[rgba(193,102,59,0.28)] bg-[linear-gradient(180deg,rgba(193,102,59,0.16),rgba(193,102,59,0.08))] text-[#efc19e]"
      : tone === "cyan"
        ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
        : tone === "green"
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
          : tone === "red"
            ? "border-red-400/20 bg-red-400/10 text-red-200"
            : "border-white/10 bg-white/[0.05] text-white/72";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] backdrop-blur-xl ${toneClass}`}
    >
      {children}
    </span>
  );
}
