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
  const { label, title, description, children, footer, className, strong = false } = props;

  return (
    <section
      className={cx(
        "rounded-3xl border p-5 md:p-6",
        strong ? glassTheme.border.strong : glassTheme.border.soft,
        strong ? glassTheme.glass.panelStrong : glassTheme.glass.panel,
        className,
      )}
    >
      {(label || title || description) && (
        <header className="mb-5 space-y-2">
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

      {children ? <div className="space-y-4">{children}</div> : null}
      {footer ? (
        <div className="mt-5 border-t border-[rgba(255,255,255,0.06)] pt-4">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
