"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";

type ActionKind = "queue" | "render" | "publish";

export default function CalendarItemActions(props: {
  contentPieceId: string;
  itemStatus: string | null;
}) {
  const { contentPieceId, itemStatus } = props;
  const router = useRouter();
  const [busy, setBusy] = useState<ActionKind | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function runAction(kind: ActionKind) {
    try {
      setBusy(kind);
      setMessage(null);

      const endpoint =
        kind === "queue"
          ? "/api/shopreel/scheduler"
          : kind === "render"
            ? "/api/shopreel/render-worker"
            : "/api/shopreel/publish-worker";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contentPieceId }),
      });

      const json = (await res.json()) as Record<string, unknown>;

      if (!res.ok || json.ok !== true) {
        throw new Error(
          typeof json.error === "string" ? json.error : `Failed to ${kind} item`,
        );
      }

      setMessage(
        kind === "queue"
          ? "Queued"
          : kind === "render"
            ? "Rendered"
            : "Published",
      );

      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  const normalizedStatus = (itemStatus ?? "planned").toLowerCase();

  const canQueue = normalizedStatus === "planned";
  const canRender = normalizedStatus === "queued" || normalizedStatus === "rendering";
  const canPublish = normalizedStatus === "ready" || normalizedStatus === "publishing";

  return (
    <div className="mt-4 flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        {canQueue ? (
          <GlassButton
            variant="secondary"
            onClick={() => void runAction("queue")}
            disabled={busy !== null}
          >
            {busy === "queue" ? "Queueing..." : "Queue"}
          </GlassButton>
        ) : null}

        {canRender ? (
          <GlassButton
            variant="secondary"
            onClick={() => void runAction("render")}
            disabled={busy !== null}
          >
            {busy === "render" ? "Rendering..." : "Render"}
          </GlassButton>
        ) : null}

        {canPublish ? (
          <GlassButton
            variant="primary"
            onClick={() => void runAction("publish")}
            disabled={busy !== null}
          >
            {busy === "publish" ? "Publishing..." : "Publish"}
          </GlassButton>
        ) : null}
      </div>

      {message ? <div className="text-xs text-white/70">{message}</div> : null}
    </div>
  );
}
