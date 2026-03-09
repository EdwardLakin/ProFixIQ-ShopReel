export default function ShopReelKeyValue(props: {
  label: string;
  value: string | number | null | undefined;
}) {
  const display =
    props.value === null || props.value === undefined || props.value === ""
      ? "—"
      : String(props.value);

  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">
        {props.label}
      </div>
      <div className="mt-2 break-words text-sm text-white/80">{display}</div>
    </div>
  );
}
