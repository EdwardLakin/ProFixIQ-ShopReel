import type { ReactNode } from "react";
import { glassTheme, cx } from "./glassTheme";

export default function GlassCard(props: {
  label?: string;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  strong?: boolean;
  tier?: "primary" | "standard" | "quiet";
}) {
  const { label, title, description, children, footer, className, strong = false, tier = "standard" } = props;

  return (
    <section
      className={cx(
        "rounded-2xl border p-4 md:p-5",
        strong ? glassTheme.border.strong : glassTheme.border.soft,
        strong || tier === "primary"
          ? glassTheme.glass.panelStrong
          : tier === "quiet"
            ? glassTheme.glass.panelSoft
            : glassTheme.glass.panel,
        tier === "primary" && "shadow-[0_24px_70px_rgba(8,10,30,0.5)]",
        tier === "quiet" && "opacity-90",
        className,
      )}
    >
      {(label || title || description) && (
        <header className="mb-4 space-y-1.5">
          {label ? (
            <div
              className={cx(
                "text-[11px] font-semibold uppercase tracking-[0.24em]",
                glassTheme.text.copper,
              )}
            >
              {label}
            </div>
          ) : null}

          {title ? (
            <h2
              className={cx(
                "text-base tracking-[0.01em] md:text-lg font-semibold",
                glassTheme.text.primary,
              )}
            >
              {title}
            </h2>
          ) : null}

          {description ? (
            <p className={cx("text-sm leading-5", glassTheme.text.secondary)}>
              {description}
            </p>
          ) : null}
        </header>
      )}

      {children ? <div className="space-y-3">{children}</div> : null}
      {footer ? (
        <div className="mt-4 border-t border-[rgba(255,255,255,0.06)] pt-3.5">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
