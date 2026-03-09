import { glassTheme, cx } from "./glassTheme";

export default function GlassStat(props: {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
}) {
  const { label, value, hint, trend } = props;

  return (
    <div
      className={cx(
        "rounded-3xl border p-5 md:p-6",
        glassTheme.border.softer,
        glassTheme.glass.panel,
      )}
    >
      <div className={cx("text-[11px] font-semibold uppercase tracking-[0.24em]", glassTheme.text.copper)}>
        {label}
      </div>

      <div className={cx("mt-3 text-2xl font-semibold tracking-tight md:text-3xl", glassTheme.text.primary)}>
        {value}
      </div>

      {(hint || trend) && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          {trend ? <span className="text-[color:#d2a17e]">{trend}</span> : null}
          {hint ? <span className={glassTheme.text.secondary}>{hint}</span> : null}
        </div>
      )}
    </div>
  );
}