type Props = {
  label: string;
  description?: string;
  enabled?: boolean;
};

export default function ShopReelToggleRow({
  label,
  description,
  enabled = false,
}: Props) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[20px] border border-white/8 bg-black/20 px-4 py-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-white">{label}</div>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-white/58">{description}</p>
        ) : null}
      </div>

      <div
        className={[
          "mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition",
          enabled
            ? "border-[#c1663b]/40 bg-[rgba(193,102,59,0.22)]"
            : "border-white/10 bg-white/5",
        ].join(" ")}
      >
        <div
          className={[
            "h-5 w-5 rounded-full transition",
            enabled
              ? "translate-x-6 bg-[#e3a37b]"
              : "translate-x-1 bg-white/65",
          ].join(" ")}
        />
      </div>
    </div>
  );
}
