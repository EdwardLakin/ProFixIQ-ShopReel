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
        "inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50",
        glassTheme.accent.copperRing,
        variant === "primary" &&
          "border-[rgba(201,139,92,0.34)] bg-[linear-gradient(180deg,rgba(201,139,92,0.28),rgba(201,139,92,0.16))] text-[color:#fff7f0] shadow-[0_10px_24px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-[rgba(201,139,92,0.42)] hover:bg-[linear-gradient(180deg,rgba(201,139,92,0.32),rgba(201,139,92,0.20))]",
        variant === "secondary" &&
          "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.055)] text-[color:#f5eee7] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.075)]",
        variant === "ghost" &&
          "border-transparent bg-transparent text-[color:rgba(245,238,231,0.72)] hover:border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[color:#f5eee7]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
