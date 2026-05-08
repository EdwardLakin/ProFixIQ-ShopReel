type ShopReelInputPreviewProps = {
  title?: string;
  value?: string | null;
  emptyLabel?: string;
};

export default function ShopReelInputPreview({
  title = "Input",
  value,
  emptyLabel = "No input provided yet.",
}: ShopReelInputPreviewProps) {
  return (
    <div className="relative overflow-hidden rounded-[1.45rem] border border-white/10 bg-black/24 p-4 shadow-[0_14px_42px_rgba(0,0,0,.24)] backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/20 to-transparent" />
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-200/60">
        {title}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-6 text-white/68">
        {value && value.trim().length > 0 ? value : emptyLabel}
      </p>
    </div>
  );
}
