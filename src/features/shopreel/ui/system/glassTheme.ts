export const glassTheme = {
  bg: {
    base: "bg-[#050816]",
    overlay:
      "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.10),transparent_24%),radial-gradient(circle_at_bottom,rgba(34,211,238,0.10),transparent_30%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_22%,transparent_78%,rgba(255,255,255,0.03))] before:content-['']",
    grid: "absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:18px_18px]",
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
      "bg-white/[0.045] backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.42)]",
    panelStrong:
      "bg-white/[0.06] backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,0.52)]",
    panelSoft:
      "bg-white/[0.035] backdrop-blur-lg shadow-[0_8px_30px_rgba(0,0,0,0.34)]",
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
    shell: "px-4 py-6 md:px-6 md:py-8 xl:px-8",
    section: "space-y-6",
    grid: "gap-4 md:gap-5 xl:gap-6",
  },
} as const;

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
