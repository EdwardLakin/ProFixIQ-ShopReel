import type { ReactNode } from "react";

type ShopReelSectionGridProps = {
  children: ReactNode;
  className?: string;
};

export default function ShopReelSectionGrid({
  children,
  className = "",
}: ShopReelSectionGridProps) {
  return (
    <div
      className={[
        "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
