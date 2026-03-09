export default function ShopReelStat(props: {
  label: string;
  value: string | number;
}) {
  const { label, value } = props;

  return (
    <div className="rounded-[26px] border border-[rgba(193,102,59,0.12)] bg-[radial-gradient(circle_at_top,rgba(193,102,59,0.08),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.14)] backdrop-blur-2xl">
      <div className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#d6a17d]">
        {label}
      </div>
      <div
        className="mt-4 text-white"
        style={{
          fontFamily:
            "var(--font-blackops), var(--font-inter), system-ui, sans-serif",
          fontSize: "clamp(2rem, 3vw, 2.85rem)",
          lineHeight: "1",
        }}
      >
        {value}
      </div>
    </div>
  );
}
