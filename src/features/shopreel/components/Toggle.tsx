"use client";

import type { ButtonHTMLAttributes } from "react";

type ToggleProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  checked?: boolean;
};

export default function Toggle({
  checked = false,
  className = "",
  type = "button",
  ...props
}: ToggleProps) {
  return (
    <button
      type={type}
      aria-pressed={checked}
      className={[
        "relative h-7 w-12 rounded-full border transition duration-200",
        checked
          ? "border-cyan-300/35 bg-cyan-300/24 shadow-[0_0_24px_rgba(34,211,238,.18)]"
          : "border-white/10 bg-white/[0.06]",
        className,
      ].join(" ")}
      {...props}
    >
      <span
        className={[
          "absolute top-1 h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}
