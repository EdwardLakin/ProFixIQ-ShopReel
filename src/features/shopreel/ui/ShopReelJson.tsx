import type { CSSProperties } from "react";

export default function ShopReelJson(props: {
  data: unknown;
  maxHeightClassName?: string;
}) {
  const style: CSSProperties = {
    overflow: "auto",
    maxHeight: 520,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.25)",
    padding: 16,
    fontSize: 12,
    color: "#e2e8f0",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  };

  return <pre style={style}>{JSON.stringify(props.data, null, 2)}</pre>;
}
