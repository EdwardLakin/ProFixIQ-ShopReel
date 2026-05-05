import Link from "next/link";

type ShopReelTemplateCardProps = {
  title: string;
  description: string;
  icon: string;
  tone: string;
};

export default function ShopReelTemplateCard({ title, description, icon, tone }: ShopReelTemplateCardProps) {
  return (
    <Link
      href={`/shopreel/create?template=${encodeURIComponent(title)}`}
      className="group relative overflow-hidden rounded-xl border border-white/12 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-3 py-2.5 shadow-[0_10px_30px_rgba(7,10,24,0.28)] transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_18px_40px_rgba(87,70,190,0.35)]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div className="flex items-start gap-2.5">
        <div className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-gradient-to-br ${tone} text-[15px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold leading-5 text-white group-hover:text-cyan-100">{title}</div>
          <div className="mt-0.5 text-[11px] leading-4 text-white/68">{description}</div>
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-8 right-[-18px] h-16 w-16 rounded-full bg-cyan-300/10 blur-2xl transition group-hover:bg-cyan-300/20" />
    </Link>
  );
}
