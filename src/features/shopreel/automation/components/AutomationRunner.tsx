"use client";

import { useState } from "react";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";

export default function AutomationRunner() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAutomation() {
    try {
      setRunning(true);
      setError(null);
      setResult(null);

      const res = await fetch("/api/shopreel/automation/run", {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to run automation");
      }

      setResult(JSON.stringify(json, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run automation");
    } finally {
      setRunning(false);
    }
  }

  return (
    <GlassCard
      label="Loop Runner"
      title="Run ShopReel automation"
      description="Manual trigger for processing video sync, campaign analytics, and learnings."
      strong
    >
      <div className="flex flex-wrap gap-3">
        <GlassButton variant="primary" onClick={() => void runAutomation()} disabled={running}>
          {running ? "Running..." : "Run Automation Cycle"}
        </GlassButton>
      </div>

      {error ? (
        <div className={cx("mt-4 text-sm", glassTheme.text.copperSoft)}>{error}</div>
      ) : null}

      {result ? (
        <pre
          className={cx(
            "mt-4 overflow-x-auto rounded-2xl border p-4 text-xs whitespace-pre-wrap",
            glassTheme.border.softer,
            glassTheme.glass.panelSoft,
            glassTheme.text.secondary
          )}
        >
{result}
        </pre>
      ) : null}
    </GlassCard>
  );
}
