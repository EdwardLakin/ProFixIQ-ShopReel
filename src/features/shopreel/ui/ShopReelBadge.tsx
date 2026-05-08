type ShopReelBadgeProps = {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "danger" | "info";
  className?: string;
};

const toneClasses = {
  neutral: "border-white/10 bg-white/[0.055] text-white/64",
  good: "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100",
  warn: "border-amber-300/22 bg-amber-300/[0.09] text-amber-100",
  danger: "border-rose-300/22 bg-rose-400/[0.10] text-rose-100",
  info: "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100",
};

export default function ShopReelBadge({
  children,
  tone = "neutral",
  className = "",
}: ShopReelBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur-xl",
        toneClasses[tone],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
