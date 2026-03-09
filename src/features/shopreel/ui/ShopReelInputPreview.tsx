type Props = {
  label: string;
  value?: string | null;
  placeholder?: string;
};

export default function ShopReelInputPreview({
  label,
  value,
  placeholder = "Not set",
}: Props) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.24em] text-white/42">
        {label}
      </div>
      <div className="mt-2 text-sm text-white/80">{value?.trim() ? value : placeholder}</div>
    </div>
  );
}
