export default function ShopReelStat(props: {
  label: string;
  value: string | number;
}) {
  const { label, value } = props;

  return (
    <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.24)]">
      <div className="text-[11px] font-medium uppercase tracking-[0.34em] text-white/52">
        {label}
      </div>
      <div className="mt-4 font-display text-4xl leading-none tracking-[0.02em] text-white sm:text-[2.75rem]">
        {value}
      </div>
    </div>
  );
}
