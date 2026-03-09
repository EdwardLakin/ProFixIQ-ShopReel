export default function ShopReelStat(props: {
  label: string;
  value: string | number;
}) {
  const { label, value } = props;

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <div className="text-[12px] font-medium uppercase tracking-[0.28em] text-white/55">
        {label}
      </div>
      <div className="mt-3 font-display text-5xl tracking-tight text-white">
        {value}
      </div>
    </div>
  );
}