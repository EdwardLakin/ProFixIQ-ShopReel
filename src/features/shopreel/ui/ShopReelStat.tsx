export default function ShopReelStat(props: {
  label: string;
  value: string | number;
}) {
  const { label, value } = props;

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,23,40,0.84),rgba(9,14,26,0.94))] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.24)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(193,102,59,0.05),transparent_40%)]" />
      <div className="relative">
        <div className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#d8a785]/90">
          {label}
        </div>
        <div
          className="mt-4 text-white"
          style={{
            fontFamily:
              "var(--font-blackops), var(--font-inter), system-ui, sans-serif",
            fontSize: "clamp(2.1rem, 3vw, 3.2rem)",
            lineHeight: "1",
            letterSpacing: "0.02em",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
