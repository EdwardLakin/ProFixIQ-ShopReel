type Props = {
  label: string;
  value: string | number | null | undefined;
};

export default function ShopReelKeyValue({ label, value }: Props) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
        {label}
      </div>
      <div className="mt-1 text-sm text-white/85">
        {value === null || value === undefined || value === "" ? "—" : String(value)}
      </div>
    </div>
  );
}
