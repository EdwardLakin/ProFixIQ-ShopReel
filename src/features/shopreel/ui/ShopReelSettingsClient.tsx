"use client";

import { useMemo, useState } from "react";

type PlatformRow = {
  platform: "instagram_reels" | "facebook" | "youtube_shorts" | "tiktok";
  enabled: boolean;
  connection_active: boolean;
  connection_status: "not_connected" | "connected" | "expired" | "error";
  publish_mode: "manual" | "scheduled" | "autopilot";
  account_label: string | null;
};

type Props = {
  shopId: string;
  initial: {
    settings: {
      publish_mode: "manual" | "approval_required" | "autopilot";
      default_cta: string | null;
      default_location: string | null;
      brand_voice: string | null;
      onboarding_completed: boolean;
    } | null;
    platforms: PlatformRow[];
    readiness: {
      connectedCount: number;
      enabledCount: number;
      canPublish: boolean;
      canAutopilot: boolean;
      missing: string[];
    };
  };
};

function labelForPlatform(platform: string) {
  switch (platform) {
    case "instagram_reels":
      return "Instagram Reels";
    case "facebook":
      return "Facebook";
    case "youtube_shorts":
      return "YouTube Shorts";
    case "tiktok":
      return "TikTok";
    default:
      return platform;
  }
}

export default function ShopReelSettingsClient({ shopId, initial }: Props) {
  const [publishMode, setPublishMode] = useState(
    initial.settings?.publish_mode ?? "manual",
  );
  const [defaultCta, setDefaultCta] = useState(
    initial.settings?.default_cta ?? "",
  );
  const [defaultLocation, setDefaultLocation] = useState(
    initial.settings?.default_location ?? "",
  );
  const [brandVoice, setBrandVoice] = useState(
    initial.settings?.brand_voice ?? "",
  );
  const [onboardingCompleted, setOnboardingCompleted] = useState(
    initial.settings?.onboarding_completed ?? false,
  );
  const [platforms, setPlatforms] = useState(initial.platforms);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const connectedCount = useMemo(
    () => platforms.filter((p) => p.connection_active).length,
    [platforms],
  );

  const enabledCount = useMemo(
    () => platforms.filter((p) => p.enabled).length,
    [platforms],
  );

  const missing = useMemo(() => {
    const result: string[] = [];
    if (!defaultCta.trim()) result.push("Default CTA");
    if (!defaultLocation.trim()) result.push("Default location");
    if (!brandVoice.trim()) result.push("Brand voice");
    if (enabledCount === 0) result.push("At least one enabled platform");
    if (connectedCount === 0) result.push("At least one connected platform");
    if (!onboardingCompleted) result.push("Launch onboarding completion");
    return result;
  }, [
    brandVoice,
    connectedCount,
    defaultCta,
    defaultLocation,
    enabledCount,
    onboardingCompleted,
  ]);

  async function save() {
    setSaving(true);
    setSavedMessage(null);

    const response = await fetch("/api/shopreel/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopId,
        publishMode,
        defaultCta,
        defaultLocation,
        brandVoice,
        onboardingCompleted,
        platforms: platforms.map((platform) => ({
          platform: platform.platform,
          enabled: platform.enabled,
          connectionActive: platform.connection_active,
          publishMode: platform.publish_mode,
        })),
      }),
    });

    const data = await response.json().catch(() => null);

    setSaving(false);
    setSavedMessage(data?.ok ? "Settings saved." : "Save failed.");
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
          <div className="text-[12px] uppercase tracking-[0.3em] text-[#d5a07a]">
            Launch Readiness
          </div>
          <div className="mt-4 font-display text-5xl text-white">
            {connectedCount}
          </div>
          <div className="mt-3 text-white/72">Connected platforms</div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
          <div className="text-[12px] uppercase tracking-[0.3em] text-[#d5a07a]">
            Publishing Scope
          </div>
          <div className="mt-4 font-display text-5xl text-white">
            {enabledCount}
          </div>
          <div className="mt-3 text-white/72">Enabled destinations</div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
          <div className="text-[12px] uppercase tracking-[0.3em] text-[#d5a07a]">
            Safety
          </div>
          <div className="mt-4 inline-flex rounded-full border border-[rgba(193,102,59,0.35)] bg-[rgba(193,102,59,0.12)] px-4 py-2 text-[12px] uppercase tracking-[0.24em] text-[#e1b08b]">
            {publishMode.replaceAll("_", " ")}
          </div>
          <div className="mt-3 text-white/72">
            Recommended launch default: manual publish.
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6">
        <div className="text-[12px] uppercase tracking-[0.3em] text-[#d5a07a]">
          Content Identity
        </div>
        <h2 className="mt-3 text-3xl text-white">Brand Defaults</h2>

        <div className="mt-6 grid gap-4">
          <label className="rounded-[20px] border border-white/10 bg-black/20 p-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">
              Default CTA
            </div>
            <input
              value={defaultCta}
              onChange={(e) => setDefaultCta(e.target.value)}
              className="mt-3 w-full bg-transparent text-lg text-white outline-none"
            />
          </label>

          <label className="rounded-[20px] border border-white/10 bg-black/20 p-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">
              Default Location
            </div>
            <input
              value={defaultLocation}
              onChange={(e) => setDefaultLocation(e.target.value)}
              className="mt-3 w-full bg-transparent text-lg text-white outline-none"
            />
          </label>

          <label className="rounded-[20px] border border-white/10 bg-black/20 p-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">
              Brand Voice
            </div>
            <textarea
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              rows={3}
              className="mt-3 w-full resize-none bg-transparent text-lg text-white outline-none"
            />
          </label>

          <label className="flex items-center justify-between rounded-[20px] border border-white/10 bg-black/20 p-4">
            <div>
              <div className="text-lg text-white">Launch onboarding complete</div>
              <div className="mt-1 text-sm text-white/62">
                Required before enabling full autopilot.
              </div>
            </div>
            <input
              type="checkbox"
              checked={onboardingCompleted}
              onChange={(e) => setOnboardingCompleted(e.target.checked)}
            />
          </label>

          <label className="rounded-[20px] border border-white/10 bg-black/20 p-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">
              Publish Mode
            </div>
            <select
              value={publishMode}
              onChange={(e) =>
                setPublishMode(
                  e.target.value as "manual" | "approval_required" | "autopilot",
                )
              }
              className="mt-3 w-full bg-transparent text-lg text-white outline-none"
            >
              <option value="manual" className="bg-[#071127]">
                manual
              </option>
              <option value="approval_required" className="bg-[#071127]">
                approval required
              </option>
              <option value="autopilot" className="bg-[#071127]">
                autopilot
              </option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6">
        <div className="text-[12px] uppercase tracking-[0.3em] text-[#d5a07a]">
          Destinations
        </div>
        <h2 className="mt-3 text-3xl text-white">Platform Connections</h2>

        <div className="mt-6 grid gap-5">
          {platforms.map((platform, index) => (
            <div
              key={platform.platform}
              className="rounded-[24px] border border-white/10 bg-black/20 p-5"
            >
              <div className="text-2xl text-white">
                {labelForPlatform(platform.platform)}
              </div>
              <div className="mt-2 text-white/60">
                {platform.connection_active
                  ? "Connected and available for publishing."
                  : "Not connected yet. OAuth / account linking still needs implementation."}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/80">
                  {platform.connection_active ? "Connected" : "Not connected"}
                </span>
                <span className="inline-flex rounded-full border border-[rgba(193,102,59,0.35)] bg-[rgba(193,102,59,0.12)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#e1b08b]">
                  {platform.enabled ? "Enabled" : "Disabled"}
                </span>
                <span className="inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-200">
                  {platform.publish_mode}
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="flex items-center justify-between rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div>
                    <div className="text-lg text-white">Enable this platform</div>
                    <div className="mt-1 text-sm text-white/62">
                      Allow ShopReel to prepare content for this destination.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={platform.enabled}
                    onChange={(e) => {
                      const next = [...platforms];
                      next[index] = { ...platform, enabled: e.target.checked };
                      setPlatforms(next);
                    }}
                  />
                </label>

                <label className="flex items-center justify-between rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div>
                    <div className="text-lg text-white">Connection active</div>
                    <div className="mt-1 text-sm text-white/62">
                      This becomes real once per-shop OAuth is wired.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={platform.connection_active}
                    onChange={(e) => {
                      const next = [...platforms];
                      next[index] = {
                        ...platform,
                        connection_active: e.target.checked,
                        connection_status: e.target.checked
                          ? "connected"
                          : "not_connected",
                      };
                      setPlatforms(next);
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6">
        <div className="text-[12px] uppercase tracking-[0.3em] text-[#d5a07a]">
          What still needs wiring
        </div>
        <h2 className="mt-3 text-3xl text-white">Launch Checklist</h2>

        <div className="mt-6 grid gap-3">
          {missing.length === 0 ? (
            <div className="rounded-[20px] border border-emerald-500/20 bg-emerald-500/10 px-5 py-5 text-emerald-100">
              ShopReel settings are launch-ready for this shop.
            </div>
          ) : (
            missing.map((item) => (
              <div
                key={item}
                className="rounded-[20px] border border-dashed border-white/10 bg-black/20 px-5 py-5 text-white/82"
              >
                {item}
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-full border border-[rgba(193,102,59,0.45)] bg-[rgba(193,102,59,0.16)] px-5 py-3 text-sm uppercase tracking-[0.2em] text-[#efc19e] transition hover:bg-[rgba(193,102,59,0.24)] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save settings"}
          </button>

          {savedMessage ? (
            <div className="text-sm text-white/72">{savedMessage}</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
