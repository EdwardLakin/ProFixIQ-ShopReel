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
}) {
  const {
    label,
    title,
    description,
    children,
    footer,
    className,
    strong = false,
  } = props;

  return (
    <section
      className={cx(
        "relative overflow-hidden rounded-3xl border p-5 md:p-6",
        "before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/35 before:to-transparent before:content-['']",
        strong ? glassTheme.border.strong : glassTheme.border.soft,
        strong ? glassTheme.glass.panelStrong : glassTheme.glass.panel,
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.08),transparent_34%)]" />

      {(label || title || description) && (
        <header className="relative mb-5 space-y-2">
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
                "text-lg tracking-[0.01em] md:text-xl font-semibold",
                glassTheme.text.primary,
              )}
            >
              {title}
            </h2>
          ) : null}

          {description ? (
            <p className={cx("text-sm leading-6", glassTheme.text.secondary)}>
              {description}
            </p>
          ) : null}
        </header>
      )}

      {children ? <div className="relative space-y-4">{children}</div> : null}

      {footer ? (
        <div className="relative mt-5 border-t border-white/10 pt-4">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
