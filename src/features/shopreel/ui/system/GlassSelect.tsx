import type { SelectHTMLAttributes, ReactNode } from "react";

type GlassSelectOption = {
  value: string;
  label: string;
};

type GlassSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  children?: ReactNode;
  options?: GlassSelectOption[];
};

export default function GlassSelect({
  label,
  hint,
  className = "",
  children,
  options,
  ...props
}: GlassSelectProps) {
  return (
    <label className="block space-y-2">
      {label ? (
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/46">
          {label}
        </span>
      ) : null}
      <select
        className={[
          "w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm text-white shadow-inner outline-none backdrop-blur-xl transition",
          "focus:border-cyan-300/38 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10",
          className,
        ].join(" ")}
        {...props}
      >
        {options?.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#050816] text-white">
            {option.label}
          </option>
        ))}
        {children}
      </select>
      {hint ? <span className="text-xs text-white/42">{hint}</span> : null}
    </label>
  );
}
