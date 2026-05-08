type ShopReelJsonProps = {
  value: unknown;
  title?: string;
};

export default function ShopReelJson({ value, title = "Payload" }: ShopReelJsonProps) {
  return (
    <details className="group rounded-[1.35rem] border border-white/10 bg-black/24 p-4 shadow-inner backdrop-blur-xl">
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.22em] text-white/52 transition group-open:text-cyan-100">
        {title}
      </summary>
      <pre className="mt-3 max-h-[30rem] overflow-auto rounded-2xl border border-white/10 bg-[#02040c]/80 p-4 text-[11px] leading-5 text-white/66">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}
