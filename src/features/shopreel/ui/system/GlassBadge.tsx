import type { ReactNode } from "react";
import { cx } from "./glassTheme";

export default function GlassBadge(props: {
  children: ReactNode;
  tone?: "default" | "copper" | "muted";
}) {
  const { children, tone = "default" } = props;

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tone === "default" &&
          "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] text-[color:#f3ede6]",
        tone === "copper" &&
          "border-[rgba(184,115,75,0.28)] bg-[rgba(184,115,75,0.14)] text-[color:#d9aa88]",
        tone === "muted" &&
          "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] text-[color:rgba(243,237,230,0.60)]",
      )}
    >
      {children}
    </span>
  );
}