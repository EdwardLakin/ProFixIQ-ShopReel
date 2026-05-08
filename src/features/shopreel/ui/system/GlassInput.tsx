import type { InputHTMLAttributes } from "react";
import { glassTheme, cx } from "./glassTheme";

export default function GlassInput(
  props: InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    hint?: string;
    error?: string;
  },
) {
  const { label, hint, error, className, id, ...rest } = props;

  return (
    <label className="block space-y-2">
      {label ? (
        <div className="flex items-center justify-between gap-3">
          <span className={cx("text-sm font-medium", glassTheme.text.primary)}>
            {label}
          </span>
          {hint ? <span className={cx("text-xs", glassTheme.text.muted)}>{hint}</span> : null}
        </div>
      ) : null}

      <input
        id={id}
        className={cx(
          "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition placeholder:text-white/32 hover:border-white/15",
          glassTheme.text.primary,
          glassTheme.glass.input,
          glassTheme.border.softer,
          "focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/18",
          className,
        )}
        {...rest}
      />

      {error ? <p className="text-xs text-[color:#d9a089]">{error}</p> : null}
    </label>
  );
}
