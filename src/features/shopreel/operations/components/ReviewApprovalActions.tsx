"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";

export default function ReviewApprovalActions(props: { generationId: string; compact?: boolean }) {
  const { generationId, compact = false } = props;
  const [pendingAction, setPendingAction] = useState<"approve" | "needs_changes" | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(action: "approve" | "needs_changes") {
    if (pendingAction) return;

    try {
      setPendingAction(action);
      setError(null);

      const res = await fetch(`/api/shopreel/generations/${generationId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to update review state");
      }

      setNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update review state");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className={cx("flex flex-wrap gap-2", compact ? "gap-2" : "gap-3")}>
        <GlassButton
          variant="primary"
          disabled={!!pendingAction}
          onClick={() => void submit("approve")}
        >
          {pendingAction === "approve" ? "Approving..." : "Approve"}
        </GlassButton>
        <GlassButton
          variant="secondary"
          disabled={!!pendingAction}
          onClick={() => void submit("needs_changes")}
        >
          {pendingAction === "needs_changes" ? "Sending back..." : "Needs changes"}
        </GlassButton>
      </div>

      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Optional review note"
        className={cx(
          "w-full rounded-xl border bg-transparent px-3 py-2 text-xs outline-none",
          glassTheme.border.softer,
          glassTheme.text.secondary,
        )}
        rows={compact ? 2 : 3}
      />

      {error ? <div className={cx("text-xs", glassTheme.text.copperSoft)}>{error}</div> : null}
    </div>
  );
}
