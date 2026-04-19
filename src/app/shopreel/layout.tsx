import type { ReactNode } from "react";
import ShopReelSidebar from "@/features/shopreel/ui/ShopReelSidebar";

export default function ShopReelLayout(props: { children: ReactNode }) {
  return (
    <div>
      <ShopReelSidebar />
      <div className="lg:pl-72">{props.children}</div>
    </div>
  );
}
