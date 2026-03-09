export default function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition ${
        checked
          ? "bg-[#c1663b]"
          : "bg-white/10"
      }`}
    >
      <div
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition ${
          checked ? "translate-x-6" : ""
        }`}
      />
    </button>
  )
}
