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
        "inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        glassTheme.accent.copperRing,
        variant === "primary" &&
          "border-[rgba(184,115,75,0.30)] bg-[linear-gradient(180deg,rgba(184,115,75,0.24),rgba(184,115,75,0.14))] text-[color:#f7efe7] hover:bg-[linear-gradient(180deg,rgba(184,115,75,0.28),rgba(184,115,75,0.18))]",
        variant === "secondary" &&
          "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] text-[color:#f3ede6] hover:bg-[rgba(255,255,255,0.07)]",
        variant === "ghost" &&
          "border-transparent bg-transparent text-[color:rgba(243,237,230,0.72)] hover:border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[color:#f3ede6]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}