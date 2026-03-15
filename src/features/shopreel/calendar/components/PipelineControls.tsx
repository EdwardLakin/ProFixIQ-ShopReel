"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";

type WorkerAction = "scheduler" | "render-worker" | "publish-worker";

export default function PipelineControls() {
  const router = useRouter();
  const [busy, setBusy] = useState<WorkerAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function runWorker(action: WorkerAction) {
    try {
      setBusy(action);
      setMessage(null);

      const res = await fetch(`/api/shopreel/${action}`, {
        method: "POST",
      });

      const json = (await res.json()) as Record<string, unknown>;

      if (!res.ok || json.ok !== true) {
        throw new Error(
          typeof json.error === "string" ? json.error : `Failed to run ${action}`,
        );
      }

      const count =
        typeof json.processed === "number"
          ? json.processed
          : typeof json.published === "number"
            ? json.published
            : 0;

      setMessage(`${action} ran successfully (${count})`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Worker failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <GlassButton
          variant="secondary"
          onClick={() => void runWorker("scheduler")}
          disabled={busy !== null}
        >
          {busy === "scheduler" ? "Running..." : "Run scheduler"}
        </GlassButton>
        <GlassButton
          variant="secondary"
          onClick={() => void runWorker("render-worker")}
          disabled={busy !== null}
        >
          {busy === "render-worker" ? "Running..." : "Run render"}
        </GlassButton>
        <GlassButton
          variant="secondary"
          onClick={() => void runWorker("publish-worker")}
          disabled={busy !== null}
        >
          {busy === "publish-worker" ? "Running..." : "Run publish"}
        </GlassButton>
      </div>
      {message ? <div className="text-right text-xs text-white/70">{message}</div> : null}
    </div>
  );
}
