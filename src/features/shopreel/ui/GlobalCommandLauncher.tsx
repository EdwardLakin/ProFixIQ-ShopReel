"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AiCommandInput, interpretCommand } from "@/features/shopreel/ui/system/AiCommandPrimitives";

export default function GlobalCommandLauncher() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const router = useRouter();
  const interpreted = interpretCommand(value);

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed right-3 top-3 z-40 rounded-full bg-cyan-400/15 px-3 py-2 text-xs text-cyan-50 backdrop-blur">AI Command</button>
      {open ? <div className="fixed inset-0 z-50 bg-black/70 p-4" onClick={() => setOpen(false)}>
        <div className="mx-auto mt-16 w-full max-w-2xl rounded-3xl bg-[#060b19] p-4" onClick={(e) => e.stopPropagation()}>
          <div className="mb-2 text-sm text-white/70">Command ShopReel from any page</div>
          <AiCommandInput value={value} onChange={setValue} placeholder="Type a command..." />
          <div className="mt-3 text-sm text-cyan-50/90">{interpreted.summary}</div>
          <button disabled={!interpreted.href} onClick={() => interpreted.href && router.push(interpreted.href)} className="mt-3 rounded-xl bg-gradient-to-r from-violet-500/70 to-cyan-400/70 px-4 py-2 text-sm text-white disabled:opacity-40">Execute</button>
        </div>
      </div> : null}
    </>
  );
}
