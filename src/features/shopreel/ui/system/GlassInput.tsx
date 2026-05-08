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
    <label className="block space-y-1.5">
      {label ? (
        <div className="flex items-center justify-between gap-3">
          <span className={cx("text-[13px] font-medium", glassTheme.text.primary)}>
            {label}
          </span>
          {hint ? <span className={cx("text-xs", glassTheme.text.muted)}>{hint}</span> : null}
        </div>
      ) : null}

      <input
        id={id}
        className={cx(
          "w-full min-h-10 rounded-xl border px-3.5 py-2.5 text-sm outline-none transition placeholder:text-[rgba(245,238,231,0.48)]",
          glassTheme.text.primary,
          glassTheme.glass.input,
          glassTheme.border.softer,
          "bg-[rgba(7,10,20,0.68)] focus:border-[rgba(201,139,92,0.4)] focus:ring-2 focus:ring-[rgba(201,139,92,0.22)]",
          className,
        )}
        {...rest}
      />

      {error ? <p className="text-xs text-[color:#d9a089]">{error}</p> : null}
    </label>
  );
}
