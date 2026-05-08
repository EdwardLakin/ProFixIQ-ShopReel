export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const glassTheme = {
  page: "relative min-h-screen overflow-hidden text-white",

  glass: {
    panel:
      "border border-slate-400/10 bg-white/[0.045] shadow-[0_18px_60px_rgba(0,0,0,.32)] backdrop-blur-2xl",
    panelSoft:
      "border border-slate-400/10 bg-white/[0.035] shadow-[0_12px_38px_rgba(0,0,0,.24)] backdrop-blur-xl",
    panelStrong:
      "border border-cyan-200/12 bg-white/[0.07] shadow-[0_22px_70px_rgba(0,0,0,.38)] backdrop-blur-2xl",
    input:
      "border border-slate-400/10 bg-black/24 shadow-inner backdrop-blur-xl",
  },

  border: {
    softer: "border-slate-400/10",
    soft: "border-cyan-200/12",
    copper: "border-amber-300/28",
    cyan: "border-cyan-300/28",
    danger: "border-rose-300/28",
  },

  text: {
    primary: "text-white",
    secondary: "text-white/58",
    muted: "text-white/42",
    faint: "text-white/30",
    copper: "text-amber-100",
    copperSoft: "text-amber-200/72",
    cyan: "text-cyan-100",
    cyanSoft: "text-cyan-200/72",
    danger: "text-rose-100",
  },

  surface:
    "relative overflow-hidden rounded-[1.75rem] border border-slate-400/10 bg-white/[0.045] shadow-[0_18px_60px_rgba(0,0,0,.32)] backdrop-blur-2xl",
  surfaceStrong:
    "relative overflow-hidden rounded-[1.75rem] border border-cyan-200/12 bg-white/[0.07] shadow-[0_22px_70px_rgba(0,0,0,.38)] backdrop-blur-2xl",
  mutedText: "text-white/58",
  faintText: "text-white/42",
  eyebrow:
    "text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-200/62",
  title: "font-semibold tracking-[-0.04em] text-white",
  buttonPrimary:
    "rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-300 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(99,102,241,.36)] transition hover:-translate-y-0.5",
  buttonSecondary:
    "rounded-2xl border border-slate-400/10 bg-white/[0.055] px-4 py-2.5 text-sm font-semibold text-white/80 shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[0.09]",
} as const;
