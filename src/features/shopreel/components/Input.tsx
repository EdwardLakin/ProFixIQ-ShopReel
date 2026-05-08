import type { InputHTMLAttributes } from "react";

export default function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={[
        "w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white shadow-inner outline-none backdrop-blur-xl transition",
        "placeholder:text-white/32 focus:border-cyan-300/38 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
