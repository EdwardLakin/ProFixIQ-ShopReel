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
          "border-sky-400/30 bg-[linear-gradient(180deg,rgba(59,130,246,0.20),rgba(99,102,241,0.16))] text-white shadow-[0_10px_24px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-sky-300/40 hover:bg-[linear-gradient(180deg,rgba(96,165,250,0.24),rgba(129,140,248,0.20))]",
        variant === "secondary" &&
          "border-white/10 bg-white/[0.05] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-white/15 hover:bg-white/[0.08]",
        variant === "ghost" &&
          "border-transparent bg-transparent text-white/72 hover:border-white/10 hover:bg-white/[0.04] hover:text-white",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
