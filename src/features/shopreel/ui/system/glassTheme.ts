export const glassTheme = {
  bg: {
    base: "bg-[#030711]",
    overlay:
      "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_14%_12%,rgba(99,102,241,0.26),transparent_34%),radial-gradient(circle_at_84%_18%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_50%_102%,rgba(168,85,247,0.14),transparent_42%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_22%,transparent_76%,rgba(255,255,255,0.04))] before:content-['']",
    grid: "absolute inset-0 opacity-24 [background-image:radial-gradient(rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:18px_18px]",
  },

  text: {
    primary: "text-white",
    secondary: "text-white/72",
    muted: "text-white/48",
    copper: "text-sky-300/90",
    copperSoft: "text-indigo-200/90",
  },

  border: {
    soft: "border-white/10",
    softer: "border-white/8",
    strong: "border-white/15",
    copper: "border-sky-400/30",
  },

  glass: {
    panel:
      "bg-white/[0.055] backdrop-blur-2xl shadow-[0_18px_56px_rgba(2,6,23,0.56)]",
    panelStrong:
      "bg-white/[0.075] backdrop-blur-3xl shadow-[0_24px_70px_rgba(2,6,23,0.62)]",
    panelSoft:
      "bg-white/[0.05] backdrop-blur-xl shadow-[0_12px_36px_rgba(2,6,23,0.44)]",
    input:
      "bg-white/[0.04] backdrop-blur-md border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
  },

  accent: {
    copperBg: "bg-sky-400/12",
    copperBgStrong: "bg-indigo-400/18",
    copperLine: "bg-sky-400/40",
    copperRing: "focus-visible:ring-sky-400/30",
    copperBorder: "border-sky-400/35",
  },

  radius: {
    xl: "rounded-3xl",
    lg: "rounded-2xl",
    md: "rounded-xl",
  },

  spacing: {
    shell: "px-4 py-6 md:px-7 md:py-9 xl:px-10 xl:py-10",
    section: "space-y-6",
    grid: "gap-4 md:gap-5 xl:gap-6",
  },
} as const;

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
