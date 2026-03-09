import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  tone?: "copper" | "cyan" | "neutral" | "green";
};

export default function ShopReelBadge({
  children,
  tone = "neutral",
}: Props) {
  const toneClass =
    tone === "copper"
      ? "border-[#d08a45]/30 bg-[#d08a45]/10 text-[#e7b07a]"
      : tone === "cyan"
        ? "border-[#6fdcff]/30 bg-[#6fdcff]/10 text-[#9cecff]"
        : tone === "green"
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          : "border-white/10 bg-white/[0.04] text-white/75";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs ${toneClass}`}
    >
      {children}
    </span>
  );
}