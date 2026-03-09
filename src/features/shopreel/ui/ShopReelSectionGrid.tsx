import type { ReactNode } from "react";

export default function ShopReelSectionGrid(props: { children: ReactNode }) {
  return <div className="grid gap-4">{props.children}</div>;
}
