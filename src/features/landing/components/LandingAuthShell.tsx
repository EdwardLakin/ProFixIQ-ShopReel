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
    <main className="relative min-h-screen overflow-hidden bg-[#020611] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_80%_16%,rgba(147,51,234,0.24),transparent_38%),linear-gradient(180deg,#020611_0%,#040a1b_52%,#02040d_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:46px_46px]" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-5 py-8 lg:grid-cols-[1fr_510px] lg:px-6">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex items-center rounded-full bg-white/[0.04] px-4 py-2 text-sm ring-1 ring-white/15">ShopReel</Link>
          <h1 className="mt-8 max-w-xl text-6xl font-semibold leading-[1.02]">The AI-native creative operating system.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/68">Return to your operating environment.</p>
          <div className="mt-8 max-w-xl space-y-2.5">
            {["Brand brain — Persistent memory for voice, rules, and audience.","Campaign planning — From signals to strategy in one intelligent flow.","Manual-first publishing — Operator control at every stage.","Controlled automation — AI power with human approval built in."].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/[0.025] px-4 py-2.5 ring-1 ring-white/[0.08]">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400/20 to-violet-400/20 ring-1 ring-white/[0.08]">◈</span>
                <span className="text-sm text-white/82">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950/58 p-6 ring-1 ring-cyan-300/20 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_34px_120px_-45px_rgba(34,211,238,0.42),0_34px_120px_-45px_rgba(147,51,234,0.36)] backdrop-blur-2xl sm:p-8">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_0%_100%,rgba(124,58,237,0.2),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(34,211,238,0.15),transparent_34%)]" />
          <div className="relative mb-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/80">{eyebrow}</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">{subtitle}</p>
          </div>
          <div className="relative">{children}</div>
          {footer ? <div className="relative mt-6 border-t border-white/10 pt-5 text-sm text-white/72">{footer}</div> : null}
        </section>
      </div>
    </main>
  );
}

export function LandingInput(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, className, ...rest } = props;
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/88">{label}</span>
      <input
        {...rest}
        className={`auth-input w-full rounded-xl bg-[#081227] px-4 py-3 text-[15px] text-slate-100 caret-cyan-200 outline-none ring-1 ring-white/12 transition placeholder:text-slate-400/75 hover:ring-white/20 focus:ring-2 focus:ring-cyan-300/40 ${className ?? ""}`}
      />
    </label>
  );
}

export function LandingSubmitButton({ busy, busyLabel, children, disabled }: { busy?: boolean; busyLabel: string; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className="w-full rounded-xl bg-[linear-gradient(90deg,rgba(147,51,234,0.95),rgba(34,211,238,0.95))] px-4 py-3 font-semibold text-white shadow-[0_20px_56px_rgba(34,211,238,0.26),0_20px_56px_rgba(147,51,234,0.22)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60"
    >
      {busy ? busyLabel : children}
    </button>
  );
}
