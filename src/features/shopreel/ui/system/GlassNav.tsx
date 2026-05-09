import Link from "next/link";

type GlassNavItem = {
  label: string;
  href: string;
  active?: boolean;
};

type GlassNavProps = {
  items: GlassNavItem[];
};

export default function GlassNav({ items }: GlassNavProps) {
  return (
    <nav className="shopreel-rail-scroll flex gap-2 overflow-x-auto rounded-[1.35rem] border border-slate-400/10 bg-black/20 p-2 shadow-inner backdrop-blur-xl">
      {items.map((item) => (
        <Link
          key={`${item.href}-${item.label}`}
          href={item.href}
          className={[
            "min-h-10 shrink-0 rounded-2xl px-3.5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] transition duration-300",
            item.active
              ? "bg-white/[0.11] text-white shadow-[0_10px_28px_rgba(34,211,238,.14)]"
              : "text-white/48 hover:bg-white/[0.06] hover:text-white",
          ].join(" ")}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
