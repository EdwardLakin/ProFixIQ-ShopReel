import type { TextareaHTMLAttributes } from "react";
import { glassTheme, cx } from "./glassTheme";

export default function GlassTextarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement> & {
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
          <span className={cx("text-sm font-medium", glassTheme.text.primary)}>{label}</span>
          {hint ? <span className={cx("text-xs", glassTheme.text.muted)}>{hint}</span> : null}
        </div>
      ) : null}

      <textarea
        id={id}
        className={cx(
          "min-h-[120px] w-full rounded-2xl border px-4 py-3 text-sm outline-none transition placeholder:text-[rgba(243,237,230,0.34)]",
          glassTheme.text.primary,
          glassTheme.glass.input,
          glassTheme.border.softer,
          "focus:border-[rgba(184,115,75,0.28)] focus:ring-2 focus:ring-[rgba(184,115,75,0.20)]",
          className,
        )}
        {...rest}
      />

      {error ? <p className="text-xs text-[color:#d49a84]">{error}</p> : null}
    </label>
  );
}