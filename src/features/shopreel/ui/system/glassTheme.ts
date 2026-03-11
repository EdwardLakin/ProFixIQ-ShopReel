export const glassTheme = {
  bg: {
    base: "bg-[radial-gradient(circle_at_top,rgba(201,139,92,0.16),transparent_0_34%),radial-gradient(circle_at_bottom_right,rgba(184,109,63,0.10),transparent_0_24%),linear-gradient(180deg,#16110f_0%,#0f0b09_44%,#070505_100%)]",
    overlay:
      "before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_24%,transparent_76%,rgba(255,255,255,0.018))] before:content-[''] after:pointer-events-none after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_bottom_left,rgba(184,115,75,0.08),transparent_0_20%)] after:content-['']",
    grid: "absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:18px_18px]",
  },
  text: {
    primary: "text-[color:#f5eee7]",
    secondary: "text-[color:rgba(245,238,231,0.72)]",
    muted: "text-[color:rgba(245,238,231,0.54)]",
    copper: "text-[color:#c98b5c]",
    copperSoft: "text-[color:#d9aa88]",
  },
  border: {
    soft: "border-[color:rgba(255,255,255,0.09)]",
    softer: "border-[color:rgba(255,255,255,0.06)]",
    strong: "border-[color:rgba(255,255,255,0.12)]",
    copper: "border-[color:rgba(201,139,92,0.30)]",
  },
  glass: {
    panel:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.045))] backdrop-blur-xl shadow-[0_12px_30px_rgba(0,0,0,0.30)]",
    panelStrong:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.13),rgba(255,255,255,0.05))] backdrop-blur-2xl shadow-[0_18px_48px_rgba(0,0,0,0.40)]",
    panelSoft:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.085),rgba(255,255,255,0.035))] backdrop-blur-xl shadow-[0_10px_24px_rgba(0,0,0,0.22)]",
    subtle:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.075),rgba(255,255,255,0.03))] backdrop-blur-lg shadow-[0_8px_24px_rgba(0,0,0,0.24)]",
    input:
      "bg-[rgba(255,255,255,0.06)] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
  },
  accent: {
    copperBg: "bg-[rgba(201,139,92,0.16)]",
    copperLine: "bg-[rgba(201,139,92,0.40)]",
    copperRing: "focus-visible:ring-[rgba(201,139,92,0.30)]",
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
