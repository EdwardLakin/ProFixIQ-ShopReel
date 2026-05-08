export const glassTheme = {
  bg: {
    base: "bg-[#02040d]",
    overlay:
      "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.28),transparent_34%),radial-gradient(circle_at_86%_8%,rgba(34,211,238,0.20),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.12),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_18%,transparent_72%,rgba(255,255,255,0.025))] before:content-['']",
    grid: "absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:32px_32px]",
  },

  text: {
    primary: "text-white",
    secondary: "text-white/74",
    muted: "text-white/46",
    copper: "text-cyan-200/95",
    copperSoft: "text-violet-100/90",
  },

  border: {
    soft: "border-white/10",
    softer: "border-white/8",
    strong: "border-white/16",
    copper: "border-cyan-300/35",
  },

  glass: {
    panel:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.026))] backdrop-blur-2xl shadow-[0_22px_70px_rgba(0,0,0,0.46),inset_0_1px_0_rgba(255,255,255,0.08)]",
    panelStrong:
      "bg-[radial-gradient(circle_at_12%_0%,rgba(124,58,237,0.20),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.035))] backdrop-blur-2xl shadow-[0_34px_110px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.10)]",
    panelSoft:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.052),rgba(255,255,255,0.024))] backdrop-blur-xl shadow-[0_16px_50px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.06)]",
    input:
      "bg-[#070b18]/78 backdrop-blur-xl border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_26px_rgba(0,0,0,0.22)]",
  },

  accent: {
    copperBg: "bg-cyan-400/12",
    copperBgStrong: "bg-violet-400/18",
    copperLine: "bg-cyan-300/45",
    copperRing: "focus-visible:ring-cyan-300/30",
    copperBorder: "border-cyan-300/35",
  },

  radius: {
    xl: "rounded-[30px]",
    lg: "rounded-3xl",
    md: "rounded-2xl",
  },

  spacing: {
    shell: "px-4 py-6 md:px-7 md:py-9 xl:px-10",
    section: "space-y-6",
    grid: "gap-4 md:gap-5 xl:gap-6",
  },
} as const;

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
