"use client";
import { useState } from "react";
export default function CopyButton({ label, value }: { label: string; value: string }) {
  const [state, setState] = useState<"idle"|"ok"|"err">("idle");
  return <button className="rounded border border-white/20 px-2 py-1 text-xs" onClick={async()=>{try{await navigator.clipboard.writeText(value);setState("ok");setTimeout(()=>setState("idle"),1200);}catch{setState("err");}}}>{state==="idle"?label:state==="ok"?"Copied":"Copy failed"}</button>;
}
