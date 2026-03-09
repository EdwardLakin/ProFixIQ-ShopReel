import type { ReactNode } from "react";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";

export default function ShopReelShell(props: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { title, subtitle, children } = props;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(193,102,59,0.12),transparent_18%),radial-gradient(circle_at_15%_85%,rgba(193,102,59,0.06),transparent_20%),radial-gradient(circle_at_85%_20%,rgba(34,211,238,0.05),transparent_18%),linear-gradient(180deg,#04070f_0%,#071126_46%,#04070f_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,22,38,0.86),rgba(10,14,27,0.88))] shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="relative px-6 py-7 sm:px-8 sm:py-9">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(193,102,59,0.12),transparent_30%)]" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-[1px] bg-[linear-gradient(180deg,transparent,rgba(225,176,139,0.24),transparent)]" />
            <div className="relative">
              <div className="mb-3 text-[12px] uppercase tracking-[0.38em] text-[#d8a785]">
                ShopReel
              </div>

              <h1
                className="text-white"
                style={{
                  fontFamily:
                    "var(--font-blackops), var(--font-inter), system-ui, sans-serif",
                  fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
                  lineHeight: "0.98",
                  letterSpacing: "0.01em",
                }}
              >
                {title}
              </h1>

              {subtitle ? (
                <p className="mt-5 max-w-4xl text-base leading-7 text-white/78 sm:text-[1.15rem]">
                  {subtitle}
                </p>
              ) : null}

              <ShopReelNav />
            </div>
          </div>
        </section>

        <div className="mt-6 space-y-6">{children}</div>
      </div>
    </div>
  );
}
