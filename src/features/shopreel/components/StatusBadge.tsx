type StatusBadgeProps = {
  label: string;
  variant?: "neutral" | "good" | "warn" | "danger";
};

const variantClasses = {
  neutral: "border-white/10 bg-white/[0.055] text-white/64",
  good: "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100",
  warn: "border-amber-300/22 bg-amber-300/[0.09] text-amber-100",
  danger: "border-rose-300/22 bg-rose-400/[0.10] text-rose-100",
};

export default function StatusBadge({
  label,
  variant = "neutral",
}: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur-xl",
        variantClasses[variant],
      ].join(" ")}
    >
      {label}
    </span>
  );
}
