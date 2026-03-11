export const glassTheme = {
  bg: {
    base: "bg-[#0a0a0a]",
    overlay:
      "before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_28%,transparent_72%,rgba(255,255,255,0.02))] before:content-['']",
    grid: "absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:18px_18px]",
  },

  text: {
    primary: "text-white",
    secondary: "text-white/70",
    muted: "text-white/45",
    copper: "text-[#c98b5c]",
    copperSoft: "text-[#e0b89a]",
  },

  border: {
    soft: "border-white/10",
    softer: "border-white/6",
    strong: "border-white/15",
    copper: "border-[#c98b5c]/40",
  },

  glass: {
    panel:
      "bg-white/[0.04] backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.45)]",

    panelStrong:
      "bg-white/[0.06] backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,0.55)]",

    panelSoft:
      "bg-white/[0.03] backdrop-blur-lg shadow-[0_8px_30px_rgba(0,0,0,0.35)]",

    input:
      "bg-white/[0.04] backdrop-blur-md border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
  },

  accent: {
    copperBg: "bg-[#c98b5c]/15",
    copperBgStrong: "bg-[#c98b5c]/22",
    copperLine: "bg-[#c98b5c]/40",
    copperRing: "focus-visible:ring-[#c98b5c]/30",
    copperBorder: "border-[#c98b5c]/40",
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
