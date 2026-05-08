import type { ButtonHTMLAttributes, ReactNode } from "react";

type GlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  children: ReactNode;
};

const variantClasses = {
  primary:
    "border-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-300 text-white shadow-[0_18px_44px_rgba(99,102,241,.36)] hover:shadow-[0_22px_60px_rgba(34,211,238,.22)]",
  secondary:
    "border-white/12 bg-white/[0.075] text-white shadow-[0_14px_38px_rgba(0,0,0,.28)] hover:bg-white/[0.115]",
  ghost:
    "border-white/10 bg-white/[0.035] text-white/72 hover:bg-white/[0.075] hover:text-white",
  danger:
    "border-rose-300/20 bg-rose-500/[0.11] text-rose-100 shadow-[0_14px_38px_rgba(244,63,94,.12)] hover:bg-rose-500/[0.17]",
};

const sizeClasses = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
};

export default function GlassButton({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  type = "button",
  ...props
}: GlassButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-2xl border font-semibold tracking-[-0.01em] transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0",
        "focus:outline-none focus:ring-2 focus:ring-cyan-300/35 focus:ring-offset-0",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
