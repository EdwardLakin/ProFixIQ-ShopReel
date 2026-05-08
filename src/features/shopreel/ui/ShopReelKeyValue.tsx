type ShopReelKeyValueProps = {
  label: string;
  value: string | number | null | undefined;
};

export default function ShopReelKeyValue({ label, value }: ShopReelKeyValueProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/22 px-4 py-3 shadow-inner">
      <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/38">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-white/82">
        {value ?? "—"}
      </p>
    </div>
  );
}
