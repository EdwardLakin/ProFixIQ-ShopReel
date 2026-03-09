import type { CSSProperties } from "react";

export default function ShopReelJson(props: {
  data: unknown;
  maxHeightClassName?: string;
}) {
  const style: CSSProperties = {
    overflow: "auto",
    maxHeight: 520,
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    padding: 18,
    fontSize: 12,
    color: "rgba(255,255,255,0.84)",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    boxShadow:
      "0 18px 45px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
  };

  return <pre style={style}>{JSON.stringify(props.data, null, 2)}</pre>;
}