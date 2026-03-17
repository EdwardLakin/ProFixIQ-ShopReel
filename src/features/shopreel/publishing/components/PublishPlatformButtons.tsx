"use client";

import { useMemo, useState } from "react";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";

type PublishPlatform = "instagram" | "facebook" | "tiktok" | "youtube";

const PLATFORM_ORDER: PublishPlatform[] = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
];

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function PublishPlatformButtons(props: {
  generationId: string;
  canPublish: boolean;
  compact?: boolean;
}) {
  const { generationId, canPublish, compact = false } = props;
  const [pendingPlatform, setPendingPlatform] = useState<PublishPlatform | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buttons = useMemo(() => PLATFORM_ORDER, []);

  async function publishTo(platform: PublishPlatform) {
    if (!canPublish || pendingPlatform) return;

    try {
      setPendingPlatform(platform);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/generations/${generationId}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platform }),
      });

      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        alreadyQueued?: boolean;
      };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to queue publish job");
      }

      setMessage(
        json.alreadyQueued
          ? `${formatLabel(platform)} was already queued.`
          : `${formatLabel(platform)} publish queued.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to queue publish job");
    } finally {
      setPendingPlatform(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className={cx("flex flex-wrap gap-2", compact ? "gap-2" : "gap-3")}>
        {buttons.map((platform) => {
          const busy = pendingPlatform === platform;

          return (
            <GlassButton
              key={platform}
              variant={platform === "instagram" ? "primary" : "secondary"}
              disabled={!canPublish || !!pendingPlatform}
              onClick={() => void publishTo(platform)}
            >
              {busy ? `Queueing ${formatLabel(platform)}...` : formatLabel(platform)}
            </GlassButton>
          );
        })}
      </div>

      {!canPublish ? (
        <div className={cx("text-sm", glassTheme.text.secondary)}>
          This generation must be ready before it can be published.
        </div>
      ) : null}

      {message ? (
        <div className={cx("text-sm", glassTheme.text.copperSoft)}>{message}</div>
      ) : null}

      {error ? (
        <div className={cx("text-sm", glassTheme.text.copperSoft)}>{error}</div>
      ) : null}
    </div>
  );
}
