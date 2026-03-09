import { glassTheme } from "./glassTheme";

export default function GlassCard({
  title,
  eyebrow,
  children,
}: {
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={glassTheme.card + " p-8"}>
      {eyebrow && (
        <div className={`text-[11px] uppercase tracking-[0.28em] ${glassTheme.copperText}`}>
          {eyebrow}
        </div>
      )}

      {title && (
        <h2 className="mt-2 text-[1.7rem] font-semibold tracking-tight">
          {title}
        </h2>
      )}

      <div className="mt-6">{children}</div>
    </section>
  );
}
