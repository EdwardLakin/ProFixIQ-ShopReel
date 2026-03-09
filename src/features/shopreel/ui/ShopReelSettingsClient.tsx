"use client";

import { useMemo, useState } from "react";
import ShopReelBadge from "@/features/shopreel/ui/ShopReelBadge";

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

function ToggleRow(props: {
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  const { title, subtitle, checked, onChange } = props;

  return (
    <label className="flex items-center justify-between gap-4 rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] px-4 py-4 backdrop-blur-2xl">
      <div>
        <div className="text-[1.02rem] font-medium text-white">{title}</div>
        <div className="mt-1 text-sm leading-6 text-white/60">{subtitle}</div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-8 w-14 shrink-0 rounded-full border transition",
          checked
            ? "border-[rgba(193,102,59,0.38)] bg-[linear-gradient(180deg,rgba(193,102,59,0.20),rgba(193,102,59,0.10))]"
            : "border-white/10 bg-white/[0.05]",
        ].join(" ")}
        aria-pressed={checked}
      >
        <span
          className={[
            "absolute top-1 h-6 w-6 rounded-full transition",
            checked
              ? "left-7 bg-[#efc19e] shadow-[0_0_14px_rgba(193,102,59,0.22)]"
              : "left-1 bg-white/70",
          ].join(" ")}
        />
      </button>
    </label>
  );
}

function FieldShell(props: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="rounded-[22px] border border-[rgba(193,102,59,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-4 backdrop-blur-2xl">
      <div className="text-[11px] uppercase tracking-[0.28em] text-[#d8a785]">
        {props.label}
      </div>
      <div className="mt-3">{props.children}</div>
    </label>
  );
}

const fieldClass = "w-full px-4 py-3 text-lg text-white";

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
        <div className="rounded-[26px] border border-[rgba(193,102,59,0.14)] bg-[radial-gradient(circle_at_top,rgba(193,102,59,0.10),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-6 backdrop-blur-2xl">
          <div className="text-[12px] uppercase tracking-[0.32em] text-[#d5a07a]">
            Launch Readiness
          </div>
          <div
            className="mt-4 text-white"
            style={{
              fontFamily:
                "var(--font-blackops), var(--font-inter), system-ui, sans-serif",
              fontSize: "clamp(2.1rem, 3vw, 3.1rem)",
              lineHeight: "1",
            }}
          >
            {connectedCount}
          </div>
          <div className="mt-3 text-white/72">Connected platforms</div>
        </div>

        <div className="rounded-[26px] border border-[rgba(193,102,59,0.14)] bg-[radial-gradient(circle_at_top,rgba(193,102,59,0.10),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-6 backdrop-blur-2xl">
          <div className="text-[12px] uppercase tracking-[0.32em] text-[#d5a07a]">
            Publishing Scope
          </div>
          <div
            className="mt-4 text-white"
            style={{
              fontFamily:
                "var(--font-blackops), var(--font-inter), system-ui, sans-serif",
              fontSize: "clamp(2.1rem, 3vw, 3.1rem)",
              lineHeight: "1",
            }}
          >
            {enabledCount}
          </div>
          <div className="mt-3 text-white/72">Enabled destinations</div>
        </div>

        <div className="rounded-[26px] border border-[rgba(180,74,66,0.16)] bg-[radial-gradient(circle_at_top,rgba(180,74,66,0.10),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-6 backdrop-blur-2xl">
          <div className="text-[12px] uppercase tracking-[0.32em] text-[#d5a07a]">
            Safety
          </div>
          <div className="mt-4">
            <ShopReelBadge tone="copper">
              {publishMode.replaceAll("_", " ")}
            </ShopReelBadge>
          </div>
          <div className="mt-3 text-white/72">
            Recommended launch default: manual publish.
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(193,102,59,0.06),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-6 backdrop-blur-2xl">
        <div className="text-[12px] uppercase tracking-[0.32em] text-[#d5a07a]">
          Content Identity
        </div>
        <h2 className="mt-3 text-[2rem] font-semibold tracking-tight text-white">
          Brand Defaults
        </h2>

        <div className="mt-6 grid gap-4">
          <FieldShell label="Default CTA">
            <input
              value={defaultCta}
              onChange={(e) => setDefaultCta(e.target.value)}
              className={fieldClass}
              placeholder="Book your inspection today."
            />
          </FieldShell>

          <FieldShell label="Default Location">
            <input
              value={defaultLocation}
              onChange={(e) => setDefaultLocation(e.target.value)}
              className={fieldClass}
              placeholder="Calgary, Alberta"
            />
          </FieldShell>

          <FieldShell label="Brand Voice">
            <textarea
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              rows={4}
              className={`${fieldClass} resize-none`}
              placeholder="Straightforward, trustworthy, expert mechanic voice."
            />
          </FieldShell>

          <ToggleRow
            title="Launch onboarding complete"
            subtitle="Required before enabling full autopilot."
            checked={onboardingCompleted}
            onChange={setOnboardingCompleted}
          />

          <FieldShell label="Publish Mode">
            <select
              value={publishMode}
              onChange={(e) =>
                setPublishMode(
                  e.target.value as "manual" | "approval_required" | "autopilot",
                )
              }
              className={fieldClass}
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
          </FieldShell>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.04),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-6 backdrop-blur-2xl">
        <div className="text-[12px] uppercase tracking-[0.32em] text-[#d5a07a]">
          Destinations
        </div>
        <h2 className="mt-3 text-[2rem] font-semibold tracking-tight text-white">
          Platform Connections
        </h2>

        <div className="mt-6 grid gap-5">
          {platforms.map((platform, index) => (
            <div
              key={platform.platform}
              className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))] p-5 backdrop-blur-2xl"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-2xl font-medium text-white">
                  {labelForPlatform(platform.platform)}
                </div>

                <div className="flex flex-wrap gap-2">
                  <ShopReelBadge tone={platform.connection_active ? "green" : "neutral"}>
                    {platform.connection_active ? "Connected" : "Not connected"}
                  </ShopReelBadge>

                  <ShopReelBadge tone={platform.enabled ? "copper" : "neutral"}>
                    {platform.enabled ? "Enabled" : "Disabled"}
                  </ShopReelBadge>

                  <ShopReelBadge
                    tone={
                      platform.publish_mode === "autopilot"
                        ? "green"
                        : platform.publish_mode === "scheduled"
                          ? "cyan"
                          : "neutral"
                    }
                  >
                    {platform.publish_mode}
                  </ShopReelBadge>
                </div>
              </div>

              <div className="mt-3 text-white/60">
                {platform.connection_active
                  ? "Connected and available for publishing."
                  : "Not connected yet. OAuth / account linking still needs implementation."}
              </div>

              <div className="mt-5 grid gap-3">
                <ToggleRow
                  title="Enable this platform"
                  subtitle="Allow ShopReel to prepare content for this destination."
                  checked={platform.enabled}
                  onChange={(next) => {
                    const updated = [...platforms];
                    updated[index] = { ...platform, enabled: next };
                    setPlatforms(updated);
                  }}
                />

                <ToggleRow
                  title="Connection active"
                  subtitle="This becomes real once per-shop OAuth is wired."
                  checked={platform.connection_active}
                  onChange={(next) => {
                    const updated = [...platforms];
                    updated[index] = {
                      ...platform,
                      connection_active: next,
                      connection_status: next ? "connected" : "not_connected",
                    };
                    setPlatforms(updated);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(180,74,66,0.05),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-6 backdrop-blur-2xl">
        <div className="text-[12px] uppercase tracking-[0.32em] text-[#d5a07a]">
          What still needs wiring
        </div>
        <h2 className="mt-3 text-[2rem] font-semibold tracking-tight text-white">
          Launch Checklist
        </h2>

        <div className="mt-6 grid gap-3">
          {missing.length === 0 ? (
            <div className="rounded-[20px] border border-emerald-500/18 bg-emerald-500/10 px-5 py-5 text-emerald-100">
              ShopReel settings are launch-ready for this shop.
            </div>
          ) : (
            missing.map((item) => (
              <div
                key={item}
                className="rounded-[20px] border border-[rgba(180,74,66,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-5 py-5 text-white/82"
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
            className="rounded-full border border-[rgba(193,102,59,0.34)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(193,102,59,0.08))] px-5 py-3 text-sm uppercase tracking-[0.2em] text-[#efc19e] backdrop-blur-xl transition hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(193,102,59,0.12))] disabled:opacity-60"
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
