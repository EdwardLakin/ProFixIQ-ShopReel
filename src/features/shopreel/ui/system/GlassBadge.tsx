import type { ReactNode } from "react";

type GlassBadgeTone =
  | "default"
  | "muted"
  | "neutral"
  | "copper"
  | "cyan"
  | "green"
  | "red"
  | "violet";

type GlassBadgeProps = {
  children: ReactNode;
  tone?: GlassBadgeTone;
  className?: string;
};

const toneClasses: Record<GlassBadgeTone, string> = {
  default: "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100",
  muted: "border-white/10 bg-white/[0.04] text-white/48",
  neutral: "border-white/10 bg-white/[0.055] text-white/64",
  copper: "border-amber-300/22 bg-amber-300/[0.09] text-amber-100",
  cyan: "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100",
  green: "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100",
  red: "border-rose-300/22 bg-rose-400/[0.10] text-rose-100",
  violet: "border-violet-300/22 bg-violet-400/[0.10] text-violet-100",
};

export default function GlassBadge({
  children,
  tone = "neutral",
  className = "",
}: GlassBadgeProps) {
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
