export default function ShopReelKeyValue(props: {
  label: string;
  value: string | number | null | undefined;
}) {
  const display =
    props.value === null || props.value === undefined || props.value === ""
      ? "—"
      : String(props.value);

  return (
    <div className="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.022))] px-4 py-3 backdrop-blur-xl">
      <div className="text-[11px] uppercase tracking-[0.24em] text-[#d6a17d]">
        {props.label}
      </div>
      <div className="mt-2 break-words text-sm text-white/82">{display}</div>
    </div>
  );
}
