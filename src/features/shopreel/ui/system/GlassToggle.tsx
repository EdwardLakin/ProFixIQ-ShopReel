export default function GlassToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-14 rounded-full border transition ${
        checked
          ? "border-[rgba(193,102,59,0.35)] bg-[rgba(193,102,59,0.18)]"
          : "border-white/10 bg-white/[0.05]"
      }`}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full transition ${
          checked
            ? "left-7 bg-[#efc19e] shadow-[0_0_12px_rgba(193,102,59,0.35)]"
            : "left-1 bg-white/70"
        }`}
      />
    </button>
  );
}
