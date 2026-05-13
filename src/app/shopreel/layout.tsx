import type { ReactNode } from "react";
import ShopReelAppShell from "@/features/shopreel/ui/ShopReelAppShell";
import RuntimeRouteContinuityTracker from "@/features/shopreel/ui/system/RuntimeRouteContinuityTracker";
import { TransitionLayer, TransitionProvider, TransitionSurface } from "@/features/shopreel/ui/system/TransitionProvider";
import RuntimeWorldRouteShell from "@/features/shopreel/ui/system/RuntimeWorldRouteShell";

export default function ShopReelLayout(props: { children: ReactNode }) {
  return (
    <ShopReelAppShell>
      <TransitionProvider>
        <RuntimeRouteContinuityTracker />
        <TransitionLayer />
        <TransitionSurface><RuntimeWorldRouteShell>{props.children}</RuntimeWorldRouteShell></TransitionSurface>
      </TransitionProvider>
    </ShopReelAppShell>
  );
}
