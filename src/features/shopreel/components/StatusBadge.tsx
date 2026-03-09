export default function StatusBadge({
  label,
  variant = "neutral",
}: {
  label: string
  variant?: "neutral" | "good" | "warn"
}) {
  const styles = {
    neutral:
      "bg-white/5 border-white/10 text-white/80",
    good:
      "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
    warn:
      "bg-amber-500/15 border-amber-500/30 text-amber-300",
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-xs rounded-full border ${styles[variant]}`}
    >
      {label}
    </span>
  )
}
