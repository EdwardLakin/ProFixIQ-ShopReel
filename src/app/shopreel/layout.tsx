import type { ReactNode } from "react";
import ShopReelAppShell from "@/features/shopreel/ui/ShopReelAppShell";
import RuntimeRouteContinuityTracker from "@/features/shopreel/ui/system/RuntimeRouteContinuityTracker";

export default function ShopReelLayout(props: { children: ReactNode }) {
  return <ShopReelAppShell><RuntimeRouteContinuityTracker />{props.children}</ShopReelAppShell>;
}
