export const glassTheme = {
  bg: {
    base: "bg-[radial-gradient(circle_at_top,rgba(120,84,58,0.12),transparent_0_36%),linear-gradient(180deg,#141414_0%,#0d0d0d_45%,#060606_100%)]",
    overlay:
      "before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))] before:content-['']",
  },
  text: {
    primary: "text-[color:#f3ede6]",
    secondary: "text-[color:rgba(243,237,230,0.68)]",
    muted: "text-[color:rgba(243,237,230,0.48)]",
    copper: "text-[color:#b8734b]",
  },
  border: {
    soft: "border-[color:rgba(255,255,255,0.08)]",
    softer: "border-[color:rgba(255,255,255,0.06)]",
    copper: "border-[color:rgba(184,115,75,0.28)]",
  },
  glass: {
    panel:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.045))] backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.28)]",
    panelStrong:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.055))] backdrop-blur-2xl shadow-[0_18px_48px_rgba(0,0,0,0.34)]",
    input:
      "bg-[rgba(255,255,255,0.045)] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  },
  accent: {
    copperBg: "bg-[rgba(184,115,75,0.16)]",
    copperLine: "bg-[rgba(184,115,75,0.38)]",
    copperRing: "focus-visible:ring-[rgba(184,115,75,0.28)]",
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