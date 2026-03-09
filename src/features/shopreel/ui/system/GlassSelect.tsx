import type { SelectHTMLAttributes } from "react";
import { glassTheme, cx } from "./glassTheme";

export default function GlassSelect(
  props: SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    hint?: string;
    error?: string;
    options: Array<{ value: string; label: string }>;
  },
) {
  const { label, hint, error, className, id, options, ...rest } = props;

  return (
    <label className="block space-y-2">
      {label ? (
        <div className="flex items-center justify-between gap-3">
          <span className={cx("text-sm font-medium", glassTheme.text.primary)}>{label}</span>
          {hint ? <span className={cx("text-xs", glassTheme.text.muted)}>{hint}</span> : null}
        </div>
      ) : null}

      <select
        id={id}
        className={cx(
          "w-full appearance-none rounded-2xl border px-4 py-3 text-sm outline-none transition",
          glassTheme.text.primary,
          glassTheme.glass.input,
          glassTheme.border.softer,
          "focus:border-[rgba(184,115,75,0.28)] focus:ring-2 focus:ring-[rgba(184,115,75,0.20)]",
          className,
        )}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#141414] text-[#f3ede6]">
            {option.label}
          </option>
        ))}
      </select>

      {error ? <p className="text-xs text-[color:#d49a84]">{error}</p> : null}
    </label>
  );
}