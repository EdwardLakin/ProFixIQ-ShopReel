export default function GlassButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-[rgba(193,102,59,0.25)] bg-[rgba(255,255,255,0.06)] px-6 py-3 text-sm uppercase tracking-[0.18em] text-[#efc19e] backdrop-blur-xl transition hover:bg-[rgba(255,255,255,0.09)] hover:shadow-[0_0_35px_rgba(193,102,59,0.25)]"
    >
      {children}
    </button>
  );
}
