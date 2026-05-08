import type { ReactNode } from "react";
import Link from "next/link";

export function LandingAuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#02040d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(124,58,237,0.34),transparent_34%),radial-gradient(circle_at_86%_12%,rgba(34,211,238,0.24),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.16),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_22%,rgba(255,255,255,0.02))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-6 px-5 py-8 sm:px-6 lg:grid-cols-[1fr_460px] lg:gap-10 lg:py-10">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/75 backdrop-blur-xl">
            ShopReel by ProFixIQ
          </Link>
          <h1 className="mt-8 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight text-white">
            The AI-native creative operating system.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/68">
            Plan, create, review, render, export, and prepare content with a premium operator-controlled workflow.
          </p>

          <div className="mt-8 grid max-w-2xl gap-3">
            {["Brand brain", "Campaign planning", "Manual-first publishing", "Controlled automation"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white/78 backdrop-blur-xl">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,0.22),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.085),rgba(255,255,255,0.035))] p-6 shadow-[0_34px_110px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
          <div className="mb-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-200/85">{eyebrow}</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/68">{subtitle}</p>
          </div>
          {children}
          {footer ? <div className="mt-6 border-t border-white/10 pt-5 text-sm text-white/68">{footer}</div> : null}
        </section>
      </div>
    </main>
  );
}

export function LandingInput(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, className, ...rest } = props;
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/82">{label}</span>
      <input
        {...rest}
        className={`auth-input w-full rounded-2xl border border-white/15 bg-[#070b18]/88 px-4 py-3 text-[15px] text-slate-100 caret-cyan-200 outline-none transition placeholder:text-slate-400/75 hover:border-white/20 focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-300/25 ${className ?? ""}`}
      />
    </label>
  );
}

export function LandingSubmitButton({ busy, busyLabel, children, disabled }: { busy?: boolean; busyLabel: string; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className="w-full rounded-2xl border border-cyan-300/35 bg-[linear-gradient(135deg,rgba(124,58,237,0.92),rgba(34,211,238,0.82))] px-4 py-3 font-semibold text-white shadow-[0_16px_46px_rgba(34,211,238,0.22),0_16px_46px_rgba(124,58,237,0.18),inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60"
    >
      {busy ? busyLabel : children}
    </button>
  );
}
