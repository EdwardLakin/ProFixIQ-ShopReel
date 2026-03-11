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
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tracking-[0.01em]",
        tone === "default" &&
          cx(
            glassTheme.border.softer,
            "bg-[rgba(255,255,255,0.055)]",
            glassTheme.text.primary,
          ),
        tone === "copper" &&
          cx(
            glassTheme.border.copper,
            "bg-[rgba(201,139,92,0.15)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
            glassTheme.text.copperSoft,
          ),
        tone === "muted" &&
          cx(
            glassTheme.border.softer,
            "bg-[rgba(255,255,255,0.035)]",
            glassTheme.text.secondary,
          ),
      )}
    >
      {children}
    </span>
  );
}
