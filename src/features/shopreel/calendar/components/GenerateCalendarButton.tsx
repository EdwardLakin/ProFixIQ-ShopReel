"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";

export default function GenerateCalendarButton() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    try {
      setError(null);
      setIsRunning(true);

      const res = await fetch("/api/shopreel/autopilot", {
        method: "POST",
      });

      const json = (await res.json()) as
        | { ok: true }
        | { ok?: false; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(("error" in json && json.error) || "Failed to generate calendar");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate calendar");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="flex min-w-[180px] flex-col items-end gap-2">
      <GlassButton variant="primary" onClick={() => void handleGenerate()} disabled={isRunning}>
        <span className="inline-block w-[160px] text-center">
          {isRunning ? "Generating..." : "Generate calendar"}
        </span>
      </GlassButton>
      {error ? <div className="text-right text-xs text-white/70">{error}</div> : null}
    </div>
  );
}
