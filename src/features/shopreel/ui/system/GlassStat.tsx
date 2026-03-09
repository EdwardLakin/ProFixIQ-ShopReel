import { glassTheme } from "./glassTheme";

export default function GlassStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className={glassTheme.stat + " p-8"}>
      <div className={`text-[11px] uppercase tracking-[0.3em] ${glassTheme.copperText}`}>
        {label}
      </div>

      <div
        className="mt-4 text-white"
        style={{
          fontFamily:
            "var(--font-blackops), var(--font-inter), system-ui, sans-serif",
          fontSize: "clamp(2.4rem,3vw,3.2rem)",
          lineHeight: "1",
        }}
      >
        {value}
      </div>
    </div>
  );
}
