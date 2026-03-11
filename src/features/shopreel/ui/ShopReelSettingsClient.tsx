"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassInput from "@/features/shopreel/ui/system/GlassInput";
import GlassTextarea from "@/features/shopreel/ui/system/GlassTextarea";
import GlassSelect from "@/features/shopreel/ui/system/GlassSelect";
import GlassToggle from "@/features/shopreel/ui/system/GlassToggle";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";

type SettingsState = {
  brandVoice: string;
  postingTimezone: string;
  defaultAspect: string;
  captionStyle: string;
  autoApproveDrafts: boolean;
  autoQueueRenders: boolean;
  autoPublish: boolean;
  includeAdvisorCta: boolean;
  defaultHookTemplate: string;
  complianceNote: string;
};

type ShopReelPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "blog"
  | "linkedin"
  | "google_business"
  | "email";

type PlatformAccountMetadata = {
  meta_page_id?: string | null;
  meta_page_name?: string | null;
  meta_instagram_business_id?: string | null;
};

type ConnectionRow = {
  id: string;
  platform: ShopReelPlatform;
  connection_active: boolean;
  account_label: string | null;
  platform_account_id: string | null;
  platform_username: string | null;
  token_expires_at?: string | null;
  updated_at?: string | null;
  metadata?: PlatformAccountMetadata | null;
};

type ConnectionsResponse = {
  ok: boolean;
  connections?: ConnectionRow[];
  error?: string;
};

const initialState: SettingsState = {
  brandVoice: "Helpful, confident, transparent, practical",
  postingTimezone: "America/Edmonton",
  defaultAspect: "9:16",
  captionStyle: "Short and clear",
  autoApproveDrafts: false,
  autoQueueRenders: true,
  autoPublish: false,
  includeAdvisorCta: true,
  defaultHookTemplate: "Show the real issue fast, then explain the fix simply.",
  complianceNote: "Avoid overstating urgency. Keep copy factual and customer-friendly.",
};

const PLATFORM_ORDER: ShopReelPlatform[] = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "blog",
  "linkedin",
  "google_business",
  "email",
];

const CONNECTABLE_PLATFORMS: ShopReelPlatform[] = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
];

const PLATFORM_LABELS: Record<ShopReelPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  blog: "Blog",
  linkedin: "LinkedIn",
  google_business: "Google Business",
  email: "Email",
};

const PLATFORM_CONNECT_QUERY: Record<ShopReelPlatform, string> = {
  instagram: "instagram",
  facebook: "facebook",
  tiktok: "tiktok",
  youtube: "youtube",
  blog: "blog",
  linkedin: "linkedin",
  google_business: "google_business",
  email: "email",
};

function formatConnectionSubtitle(connection: ConnectionRow | null, platform: ShopReelPlatform): string {
  if (!connection) {
    return CONNECTABLE_PLATFORMS.includes(platform)
      ? "Not connected"
      : "Coming soon";
  }

  if (connection.platform === "instagram") {
    if (
      connection.account_label &&
      connection.metadata?.meta_page_name &&
      connection.account_label !== connection.metadata.meta_page_name
    ) {
      return `${connection.account_label} • ${connection.metadata.meta_page_name}`;
    }

    if (connection.account_label) {
      return connection.account_label;
    }

    if (connection.metadata?.meta_page_name) {
      return connection.metadata.meta_page_name;
    }
  }

  if (connection.platform === "facebook") {
    if (connection.account_label) {
      return connection.account_label;
    }

    if (connection.metadata?.meta_page_name) {
      return connection.metadata.meta_page_name;
    }
  }

  return (
    connection.account_label ??
    connection.platform_username ??
    connection.platform_account_id ??
    "Connected"
  );
}

function isConnectionActive(connection: ConnectionRow | null): boolean {
  return Boolean(connection?.connection_active);
}

export default function ShopReelSettingsClient() {
  const [state, setState] = useState<SettingsState>(initialState);
  const [saved, setSaved] = useState(false);
  const [connections, setConnections] = useState<
    Partial<Record<ShopReelPlatform, ConnectionRow>>
  >({});
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] =
    useState<ShopReelPlatform | null>(null);

  function setField<K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
  ) {
    setSaved(false);
    setState((prev) => ({ ...prev, [key]: value }));
  }

  const loadConnections = useCallback(async () => {
    try {
      setConnectionsLoading(true);
      setConnectionsError(null);

      const res = await fetch("/api/shopreel/connections", {
        method: "GET",
        cache: "no-store",
      });

      const json = (await res.json().catch(() => ({}))) as ConnectionsResponse;

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to load connections");
      }

      const next: Partial<Record<ShopReelPlatform, ConnectionRow>> = {};

      for (const connection of json.connections ?? []) {
        next[connection.platform] = connection;
      }

      setConnections(next);
    } catch (error) {
      setConnectionsError(
        error instanceof Error ? error.message : "Failed to load connections",
      );
    } finally {
      setConnectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  async function handleSave() {
    setSaved(true);
  }

  function handleConnect(platform: ShopReelPlatform) {
    if (!CONNECTABLE_PLATFORMS.includes(platform)) return;

    setConnectingPlatform(platform);
    const platformParam = PLATFORM_CONNECT_QUERY[platform];
    window.location.href = `/api/shopreel/oauth/connect?platform=${encodeURIComponent(
      platformParam,
    )}`;
  }

  const connectionStats = useMemo(() => {
    const total = PLATFORM_ORDER.length;
    const connected = PLATFORM_ORDER.filter((platform) =>
      isConnectionActive(connections[platform] ?? null),
    ).length;

    return { total, connected };
  }, [connections]);

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassCard
          label="Brand"
          title="Voice and formatting"
          description="All fields now use the Glass system only. No page-local field styling."
        >
          <GlassInput
            label="Brand voice"
            value={state.brandVoice}
            onChange={(e) => setField("brandVoice", e.target.value)}
            placeholder="Describe tone and voice"
          />

          <GlassSelect
            label="Posting timezone"
            value={state.postingTimezone}
            onChange={(e) => setField("postingTimezone", e.target.value)}
            options={[
              { value: "America/Edmonton", label: "America/Edmonton" },
              { value: "America/Vancouver", label: "America/Vancouver" },
              { value: "America/Toronto", label: "America/Toronto" },
            ]}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <GlassSelect
              label="Default aspect"
              value={state.defaultAspect}
              onChange={(e) => setField("defaultAspect", e.target.value)}
              options={[
                { value: "9:16", label: "9:16 Vertical" },
                { value: "1:1", label: "1:1 Square" },
                { value: "16:9", label: "16:9 Landscape" },
              ]}
            />

            <GlassSelect
              label="Caption style"
              value={state.captionStyle}
              onChange={(e) => setField("captionStyle", e.target.value)}
              options={[
                { value: "Short and clear", label: "Short and clear" },
                { value: "Educational", label: "Educational" },
                { value: "Story-led", label: "Story-led" },
              ]}
            />
          </div>

          <GlassTextarea
            label="Default hook template"
            value={state.defaultHookTemplate}
            onChange={(e) => setField("defaultHookTemplate", e.target.value)}
            placeholder="Enter your preferred short-form opener"
          />

          <GlassTextarea
            label="Compliance note"
            value={state.complianceNote}
            onChange={(e) => setField("complianceNote", e.target.value)}
            placeholder="Add messaging guardrails"
          />
        </GlassCard>

        <GlassCard
          label="Automation"
          title="Approval and publishing flow"
          description="Simple toggles, same visual language, no giant page-specific class strings."
        >
          <div className="space-y-3">
            <GlassToggle
              label="Auto-queue renders"
              description="Send approved opportunities to render automatically."
              checked={state.autoQueueRenders}
              onCheckedChange={(checked) =>
                setField("autoQueueRenders", checked)
              }
            />

            <GlassToggle
              label="Auto-approve drafts"
              description="Skip manual approval for low-risk content drafts."
              checked={state.autoApproveDrafts}
              onCheckedChange={(checked) =>
                setField("autoApproveDrafts", checked)
              }
            />

            <GlassToggle
              label="Auto-publish"
              description="Publish scheduled content automatically after render completes."
              checked={state.autoPublish}
              onCheckedChange={(checked) => setField("autoPublish", checked)}
            />

            <GlassToggle
              label="Include advisor CTA"
              description="Append a light shop CTA where appropriate."
              checked={state.includeAdvisorCta}
              onCheckedChange={(checked) =>
                setField("includeAdvisorCta", checked)
              }
            />
          </div>
        </GlassCard>
      </section>

      <GlassCard
        label="Connections"
        title="Publishing destinations"
        description="Connect live channels now and stage the next expansion paths for blogs, email, LinkedIn, and Google Business."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <GlassBadge tone="default">
                {connectionStats.connected} / {connectionStats.total} active
              </GlassBadge>
              <GlassBadge tone="muted">
                Default flow: Opportunity → Draft → Render → Review → Publish
              </GlassBadge>
            </div>

            <div className="flex items-center gap-3">
              {saved ? (
                <span className="text-sm text-[color:#d2a17e]">Saved</span>
              ) : null}
              <GlassButton
                variant="secondary"
                onClick={() => void loadConnections()}
              >
                Refresh connections
              </GlassButton>
              <GlassButton variant="primary" onClick={() => void handleSave()}>
                Save settings
              </GlassButton>
            </div>
          </div>
        }
      >
        {connectionsError ? (
          <div className="mb-4 rounded-2xl border border-[rgba(184,115,75,0.22)] bg-[rgba(184,115,75,0.08)] px-4 py-3 text-sm text-[color:#d2a17e]">
            {connectionsError}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {PLATFORM_ORDER.map((platform) => {
            const connection = connections[platform] ?? null;
            const active = isConnectionActive(connection);
            const subtitle = formatConnectionSubtitle(connection, platform);
            const isBusy = connectingPlatform === platform;
            const canConnect = CONNECTABLE_PLATFORMS.includes(platform);

            return (
              <div
                key={platform}
                className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-base font-medium text-[color:#f3ede6]">
                      {PLATFORM_LABELS[platform]}
                    </div>
                    <div className="text-sm text-[color:rgba(243,237,230,0.62)]">
                      {connectionsLoading ? "Checking connection..." : subtitle}
                    </div>
                  </div>

                  <GlassBadge tone={active ? "default" : canConnect ? "muted" : "copper"}>
                    {active ? "Connected" : canConnect ? "Not connected" : "Coming soon"}
                  </GlassBadge>
                </div>

                <div className="mt-4 space-y-2 text-sm text-[color:rgba(243,237,230,0.64)]">
                  {platform === "instagram" &&
                  connection?.metadata?.meta_instagram_business_id ? (
                    <div>
                      IG business ID:{" "}
                      {connection.metadata.meta_instagram_business_id}
                    </div>
                  ) : null}

                  {platform === "facebook" &&
                  connection?.metadata?.meta_page_id ? (
                    <div>Page ID: {connection.metadata.meta_page_id}</div>
                  ) : null}

                  {connection?.token_expires_at ? (
                    <div>
                      Token expires:{" "}
                      {new Date(connection.token_expires_at).toLocaleString()}
                    </div>
                  ) : null}

                  {!canConnect ? (
                    <div>
                      Planned destination. UI and publish-path scaffolding added, live connection wiring comes next.
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <GlassButton
                    variant={active ? "secondary" : "primary"}
                    onClick={() => handleConnect(platform)}
                    disabled={isBusy || !canConnect}
                  >
                    {!canConnect
                      ? "Coming soon"
                      : isBusy
                        ? "Redirecting..."
                        : active
                          ? `Reconnect ${PLATFORM_LABELS[platform]}`
                          : `Connect ${PLATFORM_LABELS[platform]}`}
                  </GlassButton>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard
        label="Status"
        title="Connection summary"
        description="Live publishing connection state and core output preferences."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4">
            <div className="text-sm text-[color:rgba(243,237,230,0.62)]">
              Publishing timezone
            </div>
            <div className="mt-1 text-base font-medium text-[color:#f3ede6]">
              {state.postingTimezone}
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4">
            <div className="text-sm text-[color:rgba(243,237,230,0.62)]">
              Preferred format
            </div>
            <div className="mt-1 text-base font-medium text-[color:#f3ede6]">
              {state.defaultAspect} • {state.captionStyle}
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4">
            <div className="text-sm text-[color:rgba(243,237,230,0.62)]">
              Connected platforms
            </div>
            <div className="mt-1 text-base font-medium text-[color:#f3ede6]">
              {connectionStats.connected} of {connectionStats.total}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
