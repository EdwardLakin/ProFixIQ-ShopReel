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
    <div className="flex flex-col items-end gap-2">
      <GlassButton variant="primary" onClick={() => void handleGenerate()} disabled={isRunning}>
        {isRunning ? "Generating..." : "Generate calendar"}
      </GlassButton>
      {error ? <div className="text-xs text-white/70">{error}</div> : null}
    </div>
  );
}
