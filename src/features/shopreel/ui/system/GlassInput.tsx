import type { InputHTMLAttributes } from "react";

type GlassInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export default function GlassInput({
  label,
  hint,
  className = "",
  ...props
}: GlassInputProps) {
  return (
    <label className="block space-y-2">
      {label ? (
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/46">
          {label}
        </span>
      ) : null}
      <input
        className={[
          "w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm text-white shadow-inner outline-none backdrop-blur-xl transition",
          "placeholder:text-white/32 focus:border-cyan-300/38 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10",
          className,
        ].join(" ")}
        {...props}
      />
      {hint ? <span className="text-xs text-white/42">{hint}</span> : null}
    </label>
  );
}
