import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export default function PrimaryButton({
  children,
  className = "",
  type = "button",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-300 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(99,102,241,.36)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(34,211,238,.22)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
