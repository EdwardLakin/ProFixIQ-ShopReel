import type { ReactNode } from "react";
import ShopReelAppShell from "@/features/shopreel/ui/ShopReelAppShell";

export default function ShopReelLayout(props: { children: ReactNode }) {
  return <ShopReelAppShell>{props.children}</ShopReelAppShell>;
}
