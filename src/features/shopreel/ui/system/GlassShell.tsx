import type { ReactNode } from "react";
import { glassTheme, cx } from "./glassTheme";

export default function GlassShell(props: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  hidePageIntro?: boolean;
}) {
  const { eyebrow, title, subtitle, actions, children, className, hidePageIntro = false } = props;

  return (
    <div
      className={cx(
        "relative min-h-screen overflow-hidden",
        glassTheme.bg.base,
        glassTheme.bg.overlay,
      )}
    >
      <div className={glassTheme.bg.grid} />

      <div className="shopreel-floating-light-a" />
      <div className="shopreel-floating-light-b" />
      <div className="shopreel-floating-light-c" />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_20%,transparent_80%,rgba(255,255,255,0.02))]" />

      <div className="relative mx-auto w-full max-w-[1380px]">
        <div className={cx(glassTheme.spacing.shell, "space-y-4 md:space-y-5 lg:space-y-6 px-3 sm:px-4 md:px-5 lg:px-6 xl:px-7", className)}>
          <header className="space-y-3">
            {actions ? (
              <div className="flex flex-wrap items-center justify-end gap-3">
                <div className="flex flex-wrap items-center gap-3">{actions}</div>
              </div>
            ) : null}

            {!hidePageIntro ? (
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1.5">
                  {eyebrow ? (
                    <div
                      className={cx(
                        "text-[11px] font-medium uppercase tracking-[0.2em]",
                        glassTheme.text.copper,
                      )}
                    >
                      {eyebrow}
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <h1
                      className={cx(
                        "font-display text-2xl tracking-[0.01em] md:text-3xl font-semibold",
                        glassTheme.text.primary,
                      )}
                    >
                      {title}
                    </h1>

                    {subtitle ? (
                      <p className={cx("max-w-3xl text-sm leading-5 md:text-[15px]", glassTheme.text.secondary)}>
                        {subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}
