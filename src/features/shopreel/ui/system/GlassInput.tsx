export default function GlassInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-[18px] border border-[rgba(193,102,59,0.18)] bg-[rgba(255,255,255,0.06)] px-4 py-3 text-white backdrop-blur-xl outline-none focus:border-[rgba(193,102,59,0.4)] focus:ring-2 focus:ring-[rgba(193,102,59,0.2)]"
    />
  );
}
