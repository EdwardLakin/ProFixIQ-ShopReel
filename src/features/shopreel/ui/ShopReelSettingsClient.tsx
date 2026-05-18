"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassInput from "@/features/shopreel/ui/system/GlassInput";
import GlassTextarea from "@/features/shopreel/ui/system/GlassTextarea";
import GlassSelect from "@/features/shopreel/ui/system/GlassSelect";
import GlassToggle from "@/features/shopreel/ui/system/GlassToggle";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

// types unchanged
 type BrandBrainState = { positioning: string; brandVoiceRules: string; prohibitedClaims: string; preferredCtas: string; visualStyleNotes: string; audienceNotes: string; };
type SettingsState = { brandVoice: string; postingTimezone: string; defaultAspect: string; captionStyle: string; autoApproveDrafts: boolean; autoQueueRenders: boolean; autoPublish: boolean; includeBrandCta: boolean; defaultHookTemplate: string; complianceNote: string; };
type ShopReelPlatform = "instagram"|"facebook"|"tiktok"|"youtube"|"blog"|"linkedin"|"google_business"|"email";
type PlatformAccountMetadata = { meta_page_id?: string | null; meta_page_name?: string | null; meta_instagram_business_id?: string | null; };
type ConnectionRow = { id: string; platform: ShopReelPlatform; connection_active: boolean; platform_account_id: string | null; platform_username: string | null; token_expires_at?: string | null; updated_at?: string | null; metadata?: PlatformAccountMetadata | null; };
type ConnectionsResponse = { ok: boolean; connections?: ConnectionRow[]; error?: string; };

const initialBrainState: BrandBrainState = { positioning: "", brandVoiceRules: "", prohibitedClaims: "", preferredCtas: "", visualStyleNotes: "", audienceNotes: "" };
const initialState: SettingsState = { brandVoice: "Helpful, confident, transparent, practical", postingTimezone: "America/Edmonton", defaultAspect: "9:16", captionStyle: "Short and clear", autoApproveDrafts: false, autoQueueRenders: true, autoPublish: false, includeBrandCta: true, defaultHookTemplate: "Show the real issue fast, then explain the fix simply.", complianceNote: "Avoid overstating urgency. Keep copy factual and audience-friendly." };
const PLATFORM_ORDER: ShopReelPlatform[] = ["instagram","facebook","tiktok","youtube","blog","linkedin","google_business","email"];
const CONNECTABLE_PLATFORMS: ShopReelPlatform[] = ["instagram","facebook","tiktok","youtube"];
const PLATFORM_LABELS: Record<ShopReelPlatform, string> = { instagram:"Instagram", facebook:"Facebook", tiktok:"TikTok", youtube:"YouTube", blog:"Blog", linkedin:"LinkedIn", google_business:"Google Business", email:"Email" };
const PLATFORM_CONNECT_QUERY: Record<ShopReelPlatform, string> = { instagram:"instagram", facebook:"facebook", tiktok:"tiktok", youtube:"youtube", blog:"blog", linkedin:"linkedin", google_business:"google_business", email:"email" };
const NOT_YET_WIRED: ShopReelPlatform[] = ["tiktok","youtube"];

function formatConnectionSubtitle(connection: ConnectionRow | null, platform: ShopReelPlatform): string { if (!connection) { if (NOT_YET_WIRED.includes(platform)) return "OAuth wiring pending"; return CONNECTABLE_PLATFORMS.includes(platform) ? "Not connected" : "Coming soon"; } if (connection.platform === "instagram") { if (connection.metadata?.meta_page_name && connection.platform_username !== connection.metadata.meta_page_name) return `${connection.platform_username} • ${connection.metadata.meta_page_name}`; if (connection.metadata?.meta_page_name) return connection.metadata.meta_page_name; } if (connection.platform === "facebook" && connection.metadata?.meta_page_name) return connection.metadata.meta_page_name; return connection.platform_username ?? connection.metadata?.meta_page_name ?? connection.platform_account_id ?? "Connected"; }
function isConnectionActive(connection: ConnectionRow | null): boolean { return Boolean(connection?.connection_active); }

export default function ShopReelSettingsClient() {
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("oauth_error");
  const oauthSuccess = searchParams.get("oauth_success");
  const [state, setState] = useState<SettingsState>(initialState);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [brandBrain, setBrandBrain] = useState<BrandBrainState>(initialBrainState);
  const [connections, setConnections] = useState<Partial<Record<ShopReelPlatform, ConnectionRow>>>({});
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<ShopReelPlatform | null>(null);

  function setField<K extends keyof SettingsState>(key: K, value: SettingsState[K]) { setSaved(false); setSaveError(null); setState((prev) => ({ ...prev, [key]: value })); }
  function setBrainField<K extends keyof BrandBrainState>(key: K, value: BrandBrainState[K]) { setSaved(false); setSaveError(null); setBrandBrain((prev) => ({ ...prev, [key]: value })); }

  const loadConnections = useCallback(async () => { try { setConnectionsLoading(true); setConnectionsError(null); const res = await fetch("/api/shopreel/connections", { method: "GET", cache: "no-store" }); const json = (await res.json().catch(() => ({}))) as ConnectionsResponse; if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to load connections"); const next: Partial<Record<ShopReelPlatform, ConnectionRow>> = {}; for (const connection of json.connections ?? []) next[connection.platform] = connection; setConnections(next);} catch (error) { setConnectionsError(error instanceof Error ? error.message : "Failed to load connections"); } finally { setConnectionsLoading(false); } }, []);

  useEffect(() => { void loadConnections(); void (async () => { const res = await fetch("/api/shopreel/settings", { cache: "no-store" }); const json = (await res.json().catch(() => ({}))) as { settings?: { brand_voice?: string | null }; brandBrain?: { positioning?: string | null; brand_voice_rules?: string | null; prohibited_claims?: string[]; preferred_ctas?: string[]; visual_style_notes?: string | null; audience_notes?: string | null } | null; }; if (json.settings?.brand_voice) setState((prev) => ({ ...prev, brandVoice: json.settings?.brand_voice ?? prev.brandVoice })); if (json.brandBrain) { setBrandBrain({ positioning: json.brandBrain.positioning ?? "", brandVoiceRules: json.brandBrain.brand_voice_rules ?? "", prohibitedClaims: (json.brandBrain.prohibited_claims ?? []).join("\n"), preferredCtas: (json.brandBrain.preferred_ctas ?? []).join("\n"), visualStyleNotes: json.brandBrain.visual_style_notes ?? "", audienceNotes: json.brandBrain.audience_notes ?? "" }); } })(); }, [loadConnections]);

  async function handleSave() {
    try {
      setSaving(true); setSaveError(null);
      const res = await fetch("/api/shopreel/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brandVoice: state.brandVoice, brandBrain: { positioning: brandBrain.positioning, brandVoiceRules: brandBrain.brandVoiceRules, prohibitedClaims: brandBrain.prohibitedClaims.split("\n").map((s) => s.trim()).filter(Boolean), preferredCtas: brandBrain.preferredCtas.split("\n").map((s) => s.trim()).filter(Boolean), visualStyleNotes: brandBrain.visualStyleNotes, audienceNotes: brandBrain.audienceNotes } }) });
      if (!res.ok) throw new Error("Couldn't save settings.");
      setSaved(true);
    } catch (error) { setSaveError(error instanceof Error ? error.message : "Couldn't save settings."); setSaved(false); }
    finally { setSaving(false); }
  }

  function handleConnect(platform: ShopReelPlatform) { if (!CONNECTABLE_PLATFORMS.includes(platform)) return; if (NOT_YET_WIRED.includes(platform)) { setConnectionsError(`${PLATFORM_LABELS[platform]} OAuth is not wired yet.`); return; } setConnectingPlatform(platform); window.location.href = `/api/shopreel/oauth/connect?platform=${encodeURIComponent(PLATFORM_CONNECT_QUERY[platform])}`; }
  const connectionStats = useMemo(() => ({ total: PLATFORM_ORDER.length, connected: PLATFORM_ORDER.filter((platform) => isConnectionActive(connections[platform] ?? null)).length }), [connections]);

  return <div className="space-y-5">
    <section className="grid gap-5 xl:grid-cols-[1fr_0.92fr]">
      <div className="space-y-4">
        <GlassCard id="brand" label="Brand voice" title="Brand voice" description="Controls the wording ShopReel uses in campaign briefs, captions, post copy, and replies." strong>
          <GlassInput label="Brand voice" hint="Example: Helpful, practical, local, direct." value={state.brandVoice} onChange={(e)=>setField("brandVoice", e.target.value)} placeholder="Helpful, practical, local, direct" />
          <GlassTextarea label="Brand Brain voice rules" hint="Rules the AI should follow when writing. Example: avoid hype, keep it local, don’t sound corporate." value={brandBrain.brandVoiceRules} onChange={(e)=>setBrainField("brandVoiceRules", e.target.value)} placeholder="Avoid hype, keep it local, don't sound corporate" rows={4} />
          <GlassTextarea label="Prohibited claims" hint="Claims ShopReel should avoid. One per line." value={brandBrain.prohibitedClaims} onChange={(e)=>setBrainField("prohibitedClaims", e.target.value)} placeholder="Guaranteed same-day fix\nLowest price in town" rows={4} />
          <GlassTextarea label="Compliance note" hint="Extra guardrails for sensitive claims, pricing, guarantees, or regulated services." value={state.complianceNote} onChange={(e)=>setField("complianceNote", e.target.value)} placeholder="Add extra claim, pricing, and guarantee guardrails" rows={3} />
        </GlassCard>

        <GlassCard id="strategy" label="Campaign strategy" title="Campaign strategy" description="Controls how ShopReel chooses angles, hooks, audiences, and calls-to-action.">
          <GlassTextarea label="Brand Brain positioning" hint="How should ShopReel describe this brand or business when building campaigns?" value={brandBrain.positioning} onChange={(e)=>setBrainField("positioning", e.target.value)} placeholder="Trusted local team focused on practical, transparent fixes" rows={3} />
          <GlassTextarea label="Audience notes" hint="Who the content is usually for." value={brandBrain.audienceNotes} onChange={(e)=>setBrainField("audienceNotes", e.target.value)} placeholder="Homeowners and small business owners in the service area" rows={3} />
          <GlassTextarea label="Default hook template" value={state.defaultHookTemplate} onChange={(e)=>setField("defaultHookTemplate", e.target.value)} placeholder="Lead with the visible problem, then show the practical fix" rows={3} />
          <GlassTextarea label="Preferred CTAs" hint="Calls-to-action ShopReel should prefer. One per line. Example: Message to book." value={brandBrain.preferredCtas} onChange={(e)=>setBrainField("preferredCtas", e.target.value)} placeholder="Message to book\nTap to request a quote" rows={4} />
        </GlassCard>

        <GlassCard id="visuals" label="Visual generation" title="Visual generation" description="Controls image/video prompt style, aspect ratio, and caption format.">
          <GlassTextarea label="Visual style notes" hint="How images/videos should look. Example: realistic local business, clean lighting, no fake logos." value={brandBrain.visualStyleNotes} onChange={(e)=>setBrainField("visualStyleNotes", e.target.value)} placeholder="Realistic local business visuals, clean lighting, no fake logos" rows={3} />
          <div className="grid gap-4 md:grid-cols-2">
            <GlassSelect label="Default aspect" value={state.defaultAspect} onChange={(e)=>setField("defaultAspect", e.target.value)} options={[{value:"9:16",label:"9:16 Vertical"},{value:"1:1",label:"1:1 Square"},{value:"16:9",label:"16:9 Landscape"}]} />
            <GlassSelect label="Caption style" value={state.captionStyle} onChange={(e)=>setField("captionStyle", e.target.value)} options={[{value:"Short and clear",label:"Short and clear"},{value:"Educational",label:"Educational"},{value:"Story-led",label:"Story-led"}]} />
          </div>
        </GlassCard>
      </div>

      <div className="space-y-4">
        <GlassCard label="Flow map" title="How ShopReel uses these settings" description="Settings feed each stage from intake through publish-ready packages.">
          <ul className={cx("space-y-2 text-sm", glassTheme.text.secondary)}>
            <li><span className={glassTheme.text.primary}>Campaign brief:</span> Brand voice and positioning shape intake summaries and briefs.</li>
            <li><span className={glassTheme.text.primary}>Campaign angles:</span> Audience notes and hooks guide angle generation.</li>
            <li><span className={glassTheme.text.primary}>Post package:</span> Preferred CTAs affect post review and publish-ready packages.</li>
            <li><span className={glassTheme.text.primary}>Image/video prompts:</span> Visual style affects generated images and video reference frames.</li>
            <li><span className={glassTheme.text.primary}>Publishing defaults:</span> Timezone and automation settings control what happens after approval.</li>
          </ul>
        </GlassCard>

        <GlassCard id="automation" label="Publishing defaults" title="Publishing defaults" description="Controls what happens after a campaign is approved.">
          <GlassSelect label="Posting timezone" value={state.postingTimezone} onChange={(e)=>setField("postingTimezone", e.target.value)} options={[{value:"America/Edmonton",label:"America/Edmonton"},{value:"America/Vancouver",label:"America/Vancouver"},{value:"America/Toronto",label:"America/Toronto"}]} />
          <div className="space-y-3">
            <GlassToggle label="Include brand CTA" description="Append a light brand CTA where appropriate." checked={state.includeBrandCta} onCheckedChange={(checked)=>setField("includeBrandCta", checked)} />
            <GlassToggle label="Auto-queue renders" description="Automatically start render jobs after approval." checked={state.autoQueueRenders} onCheckedChange={(checked)=>setField("autoQueueRenders", checked)} />
            <GlassToggle label="Auto-approve drafts" description="Skip manual approval for low-risk drafts. Keep off while testing." checked={state.autoApproveDrafts} onCheckedChange={(checked)=>setField("autoApproveDrafts", checked)} />
            <GlassToggle label="Auto-publish after approval" description="Only available when publish queue/live publishing is fully configured." checked={false} onCheckedChange={()=>undefined} disabled />
          </div>
        </GlassCard>
      </div>
    </section>

    <GlassCard id="connections" label="Connections" title="Publishing destinations" description="Connect live channels and monitor Facebook/Instagram publish-readiness." strong footer={<div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><GlassBadge tone="default">{connectionStats.connected} / {connectionStats.total} active</GlassBadge><GlassBadge tone="muted">Default flow: Opportunity → Draft → Render → Review → Publish</GlassBadge></div><div className="flex flex-wrap items-center gap-3">{saved ? <span className={cx("text-sm", glassTheme.text.copperSoft)}>Settings saved.</span> : null}{saveError ? <span className={cx("text-sm", glassTheme.text.danger)}>Couldn&apos;t save settings.</span> : null}<GlassButton variant="secondary" onClick={() => void loadConnections()}>Refresh connections</GlassButton><GlassButton variant="primary" disabled={saving} onClick={() => void handleSave()}>{saving ? "Saving..." : "Save settings"}</GlassButton></div></div>}>
      {!saved && !saveError ? <div className={cx("mb-4 text-sm", glassTheme.text.secondary)}>Unsaved changes will be applied when you press <span className={glassTheme.text.primary}>Save settings</span>.</div> : null}
      {connectionsError ? <div className={cx("mb-4 rounded-2xl border px-4 py-3 text-sm", glassTheme.border.copper, glassTheme.glass.panelSoft, glassTheme.text.copperSoft)}>{connectionsError}</div> : null}
      <div className="grid gap-4 md:grid-cols-2">{PLATFORM_ORDER.map((platform)=>{const connection=connections[platform]??null; const active=isConnectionActive(connection); const subtitle=formatConnectionSubtitle(connection,platform); const isBusy=connectingPlatform===platform; const canConnect=CONNECTABLE_PLATFORMS.includes(platform); const notYetWired=NOT_YET_WIRED.includes(platform); return <div key={platform} className={cx("rounded-2xl border p-4", !canConnect || active ? glassTheme.border.copper : glassTheme.border.softer, glassTheme.glass.panelSoft)}><div className="flex items-start justify-between gap-3"><div className="space-y-1"><div className={cx("text-base font-medium", glassTheme.text.primary)}>{PLATFORM_LABELS[platform]}</div><div className={cx("text-sm", glassTheme.text.secondary)}>{connectionsLoading?"Checking connection...":subtitle}</div></div><GlassBadge tone={active?"default":canConnect?"muted":"copper"}>{active?"Connected":notYetWired?"Not wired yet":canConnect?"Not connected":"Coming soon"}</GlassBadge></div><div className={cx("mt-4 space-y-2 text-sm", glassTheme.text.secondary)}>{platform==="facebook"&&connection?.metadata?.meta_page_name?<div>Page name: {connection.metadata.meta_page_name}</div>:null}{platform==="facebook"&&connection?.metadata?.meta_page_id?<div>Page ID: {connection.metadata.meta_page_id}</div>:null}{platform==="instagram"&&connection?.metadata?.meta_instagram_business_id?<div>Instagram business ID: {connection.metadata.meta_instagram_business_id}</div>:null}{connection?.token_expires_at?<div>Token expiry: {new Date(connection.token_expires_at).toLocaleString()}</div>:null}{notYetWired?<div>OAuth and publish wiring still needs to be completed for this platform.</div>:!canConnect?<div>Planned destination. UI and publish-path scaffolding added, live connection wiring comes next.</div>:null}</div><div className="mt-4 flex flex-wrap gap-3"><GlassButton variant={active?"secondary":"primary"} onClick={()=>handleConnect(platform)} disabled={isBusy||!canConnect}>{!canConnect?"Coming soon":isBusy?"Redirecting...":active?`Reconnect ${PLATFORM_LABELS[platform]}`:`Connect ${PLATFORM_LABELS[platform]}`}</GlassButton></div></div>;})}</div>
    </GlassCard>

    {oauthSuccess ? <div className={cx("rounded-2xl border px-4 py-3 text-sm", glassTheme.border.copper, glassTheme.glass.panelSoft, glassTheme.text.primary)}>{oauthSuccess}</div> : null}
    {oauthError ? <div className={cx("rounded-2xl border px-4 py-3 text-sm", glassTheme.border.copper, glassTheme.glass.panelSoft, glassTheme.text.copperSoft)}>{oauthError}</div> : null}
  </div>;
}
