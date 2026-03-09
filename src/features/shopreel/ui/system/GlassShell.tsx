import { glassTheme } from "./glassTheme";

export default function GlassShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className={glassTheme.shell}>
      <div className={glassTheme.container}>
        <header className={glassTheme.hero + " p-10 mb-12"}>
          <h1 className="text-3xl font-display">{title}</h1>

          {subtitle && (
            <p className="mt-3 text-white/70 max-w-2xl">{subtitle}</p>
          )}
        </header>

        {children}
      </div>
    </main>
  );
}
