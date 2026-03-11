import type { ReactNode } from "react";
import { glassTheme, cx } from "./glassTheme";

export default function GlassShell(props: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { eyebrow, title, subtitle, actions, children, className } = props;

  return (
    <div
      className={cx(
        "relative min-h-screen overflow-hidden",
        glassTheme.bg.base,
        glassTheme.bg.overlay,
      )}
    >
      <div className={glassTheme.bg.grid} />
      <div className="relative mx-auto max-w-7xl">
        <div className={cx(glassTheme.spacing.shell, "space-y-6 md:space-y-8", className)}>
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              {eyebrow ? (
                <div
                  className={cx(
                    "text-xs font-semibold uppercase tracking-[0.32em]",
                    glassTheme.text.copper,
                  )}
                >
                  {eyebrow}
                </div>
              ) : null}

              <div className="space-y-2">
                <h1
                  className={cx(
                    "text-3xl md:text-4xl font-semibold font-['Black_Ops_One'] tracking-[0.03em]",
                    glassTheme.text.primary,
                  )}
                >
                  {title}
                </h1>
                {subtitle ? (
                  <p className={cx("max-w-3xl text-sm leading-6 md:text-base", glassTheme.text.secondary)}>
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>

            {actions ? (
              <div className="flex flex-wrap items-center gap-3">{actions}</div>
            ) : null}
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}
