"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";

export default function RetryRenderButton(props: { generationId: string }) {
  const { generationId } = props;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    try {
      setPending(true);
      setError(null);

      const res = await fetch(`/api/shopreel/story-generations/${generationId}/render`, {
        method: "POST",
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to queue render");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to queue render");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <GlassButton variant="secondary" onClick={() => void run()} disabled={pending}>
        {pending ? "Queueing render..." : "Retry render"}
      </GlassButton>
      {error ? <div className={cx("text-xs", glassTheme.text.copperSoft)}>{error}</div> : null}
    </div>
  );
}
