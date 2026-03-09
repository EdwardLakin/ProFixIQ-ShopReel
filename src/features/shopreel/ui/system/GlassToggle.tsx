"use client";

import { glassTheme, cx } from "./glassTheme";

export default function GlassToggle(props: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const { label, description, checked, onCheckedChange } = props;

  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={cx(
        "flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition",
        glassTheme.border.softer,
        glassTheme.glass.input,
      )}
      aria-pressed={checked}
    >
      <div className="space-y-1">
        <div className={cx("text-sm font-medium", glassTheme.text.primary)}>{label}</div>
        {description ? <div className={cx("text-sm", glassTheme.text.secondary)}>{description}</div> : null}
      </div>

      <span
        className={cx(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition",
          checked
            ? "border-[rgba(184,115,75,0.28)] bg-[rgba(184,115,75,0.22)]"
            : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.06)]",
        )}
      >
        <span
          className={cx(
            "absolute left-1 h-5 w-5 rounded-full bg-[color:#f3ede6] transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}