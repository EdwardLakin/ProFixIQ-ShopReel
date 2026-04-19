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

      <div className="shopreel-floating-light-a" />
      <div className="shopreel-floating-light-b" />
      <div className="shopreel-floating-light-c" />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_20%,transparent_80%,rgba(255,255,255,0.02))]" />

      <div className="relative mx-auto max-w-7xl">
        <div className={cx(glassTheme.spacing.shell, "space-y-6 md:space-y-8", className)}>
          <header className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <form action="/auth/sign-out" method="post" className="ml-1">
                <button
                  type="submit"
                  className={cx(
                    "inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm font-medium transition",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                    glassTheme.text.secondary,
                    "hover:text-white hover:bg-white/[0.06]",
                  )}
                >
                  Sign out
                </button>
              </form>

              {actions ? (
                <div className="flex flex-wrap items-center gap-3">{actions}</div>
              ) : null}
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                {eyebrow ? (
                  <div
                    className={cx(
                      "text-xs font-medium uppercase tracking-[0.24em]",
                      glassTheme.text.copper,
                    )}
                  >
                    {eyebrow}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <h1
                    className={cx(
                      "font-display text-3xl tracking-[0.01em] md:text-4xl font-semibold",
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
            </div>
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}
