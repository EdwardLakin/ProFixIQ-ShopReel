import type { HTMLAttributes, ReactNode } from "react";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
  intensity?: "soft" | "strong";
  strong?: boolean;
  label?: string;
  title?: string;
  description?: string;
  footer?: ReactNode;
};

export default function GlassCard({
  children,
  className = "",
  intensity = "soft",
  strong = false,
  label,
  title,
  description,
  footer,
  ...props
}: GlassCardProps) {
  const isStrong = strong || intensity === "strong";

  return (
    <div
      {...props}
      className={[
        "relative overflow-hidden rounded-[1.65rem] border backdrop-blur-2xl transition duration-200",
        isStrong
          ? "border-cyan-200/12 bg-white/[0.07] shadow-[0_22px_70px_rgba(0,0,0,.38)]"
          : "border-slate-400/10 bg-white/[0.045] shadow-[0_16px_52px_rgba(0,0,0,.28)]",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-cyan-100/18 before:to-transparent",
        className,
      ].join(" ")}
    >
      {(label || title || description) ? (
        <div className="border-b border-slate-400/10 px-5 py-4">
          {label ? (
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-200/62">
              {label}
            </p>
          ) : null}
          {title ? (
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-white">
              {title}
            </h3>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm leading-6 text-white/56">{description}</p>
          ) : null}
        </div>
      ) : null}

      <div className="p-5">{children}</div>

      {footer ? (
        <div className="border-t border-slate-400/10 bg-black/16 px-5 py-4">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
