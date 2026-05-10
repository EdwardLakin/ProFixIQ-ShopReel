"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import {
  getIntegrationLifecycleTruth,
  type IntegrationLifecycleTruthState,
} from "@/features/shopreel/integrations/shared/lifecycleTruth";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";

type PublishPlatform = "instagram" | "facebook" | "tiktok" | "youtube";

function truthTone(state: IntegrationLifecycleTruthState): "default" | "muted" | "copper" {
  if (state === "implemented") return "copper";
  if (state === "partial") return "default";
  return "muted";
}

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
  const [nextHint, setNextHint] = useState<"queue" | "history" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buttons = useMemo(() => PLATFORM_ORDER, []);

  async function publishTo(platform: PublishPlatform) {
    if (!canPublish || pendingPlatform) return;

    try {
      setPendingPlatform(platform);
      setError(null);
      setMessage(null);
      setNextHint(null);

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
        repairedJob?: boolean;
      };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to queue publish job");
      }

      if (json.repairedJob) {
        setMessage(`${formatLabel(platform)} publish job was repaired and queued.`);
        setNextHint("queue");
      } else if (json.alreadyQueued) {
        setMessage(`${formatLabel(platform)} already has a queued publish job.`);
        setNextHint("queue");
      } else {
        setMessage(`${formatLabel(platform)} publication and publish job queued.`);
        setNextHint("queue");
      }
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
          const truth = getIntegrationLifecycleTruth(platform);
          const isPublishEnabled = canPublish && truth.publishReady && !pendingPlatform;

          return (
            <div key={platform} className="space-y-1">
              <GlassButton
                variant={platform === "instagram" ? "primary" : "secondary"}
                disabled={!isPublishEnabled}
                onClick={() => void publishTo(platform)}
                title={truth.notes}
              >
                {busy ? `Queueing ${formatLabel(platform)}...` : formatLabel(platform)}
              </GlassButton>
              <div className="flex items-center gap-2">
                <GlassBadge tone={truthTone(truth.state)}>{truth.label}</GlassBadge>
                <span className={cx("text-xs", glassTheme.text.muted)}>{truth.publishReady ? "Live publish path" : "Not live"}</span>
              </div>
            </div>
          );
        })}
      </div>

      {!canPublish ? (
        <div className={cx("text-sm", glassTheme.text.secondary)}>
          This generation must be ready before it can be published.
        </div>
      ) : null}

      <div className={cx("text-xs", glassTheme.text.muted)}>Only integrations marked Implemented support live platform publishing in this surface.</div>

      {message ? (
        <div className="space-y-2">
          <div className={cx("text-sm", glassTheme.text.copperSoft)}>{message}</div>

          <div className="flex flex-wrap gap-2">
            <Link href="/shopreel/publish-queue">
              <GlassButton variant="ghost">
                {nextHint === "queue" ? "Open Publish Queue" : "View Queue"}
              </GlassButton>
            </Link>
            <Link href="/shopreel/published">
              <GlassButton variant="ghost">Open History</GlassButton>
            </Link>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className={cx("text-sm", glassTheme.text.copperSoft)}>{error}</div>
      ) : null}
    </div>
  );
}
