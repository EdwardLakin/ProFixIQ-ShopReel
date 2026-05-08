import type { ButtonHTMLAttributes, ReactNode } from "react";
import { glassTheme, cx } from "./glassTheme";

type Variant = "primary" | "secondary" | "ghost";

export default function GlassButton(
  props: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    children: ReactNode;
  },
) {
  const {
    className,
    variant = "secondary",
    children,
    type = "button",
    ...rest
  } = props;

  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        glassTheme.accent.copperRing,
        variant === "primary" &&
          "border-cyan-300/35 bg-[linear-gradient(135deg,rgba(124,58,237,0.92),rgba(34,211,238,0.82))] text-white shadow-[0_16px_46px_rgba(34,211,238,0.22),0_16px_46px_rgba(124,58,237,0.18),inset_0_1px_0_rgba(255,255,255,0.18)] hover:-translate-y-0.5 hover:border-cyan-200/55 hover:brightness-110",
        variant === "secondary" &&
          "border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.075),rgba(255,255,255,0.035))] text-white shadow-[0_10px_28px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.08)] hover:-translate-y-0.5 hover:border-cyan-200/25 hover:bg-white/[0.09]",
        variant === "ghost" &&
          "border-transparent bg-transparent text-white/72 hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.055] hover:text-white",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
