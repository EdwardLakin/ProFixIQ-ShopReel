import type { ReactNode } from "react";
import { glassTheme, cx } from "./glassTheme";

export default function GlassBadge(props: {
  children: ReactNode;
  tone?: "default" | "copper" | "muted";
}) {
  const { children, tone = "default" } = props;

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tracking-[0.01em] backdrop-blur-md",

        tone === "default" &&
          cx(
            glassTheme.border.softer,
            "bg-white/[0.05]",
            glassTheme.text.primary,
          ),

        tone === "copper" &&
          cx(
            glassTheme.accent.copperBorder,
            "bg-[linear-gradient(180deg,rgba(59,130,246,0.14),rgba(99,102,241,0.12))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
            glassTheme.text.copperSoft,
          ),

        tone === "muted" &&
          cx(
            glassTheme.border.softer,
            "bg-white/[0.03]",
            glassTheme.text.secondary,
          )
      )}
    >
      {children}
    </span>
  );
}
