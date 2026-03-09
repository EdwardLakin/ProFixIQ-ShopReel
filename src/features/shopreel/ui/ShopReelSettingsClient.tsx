"use client";

import { useState } from "react";
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

export default function ShopReelSettingsClient() {
  const [state, setState] = useState<SettingsState>(initialState);
  const [saved, setSaved] = useState(false);

  function setField<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSaved(false);
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    // Replace with your existing save mutation / action.
    setSaved(true);
  }

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
              onCheckedChange={(checked) => setField("autoQueueRenders", checked)}
            />

            <GlassToggle
              label="Auto-approve drafts"
              description="Skip manual approval for low-risk content drafts."
              checked={state.autoApproveDrafts}
              onCheckedChange={(checked) => setField("autoApproveDrafts", checked)}
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
              onCheckedChange={(checked) => setField("includeAdvisorCta", checked)}
            />
          </div>
        </GlassCard>
      </section>

      <GlassCard
        label="Status"
        title="Connection summary"
        description="Use this area for your real connected account and automation state."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <GlassBadge tone="default">Instagram connected</GlassBadge>
              <GlassBadge tone="muted">TikTok not connected</GlassBadge>
              <GlassBadge tone="muted">YouTube not connected</GlassBadge>
            </div>

            <div className="flex items-center gap-3">
              {saved ? <span className="text-sm text-[color:#d2a17e]">Saved</span> : null}
              <GlassButton variant="secondary">Reconnect accounts</GlassButton>
              <GlassButton variant="primary" onClick={handleSave}>
                Save settings
              </GlassButton>
            </div>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4">
            <div className="text-sm text-[color:rgba(243,237,230,0.62)]">Default flow</div>
            <div className="mt-1 text-base font-medium text-[color:#f3ede6]">Opportunity → Render → Review → Publish</div>
          </div>

          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4">
            <div className="text-sm text-[color:rgba(243,237,230,0.62)]">Publishing timezone</div>
            <div className="mt-1 text-base font-medium text-[color:#f3ede6]">{state.postingTimezone}</div>
          </div>

          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4">
            <div className="text-sm text-[color:rgba(243,237,230,0.62)]">Preferred format</div>
            <div className="mt-1 text-base font-medium text-[color:#f3ede6]">
              {state.defaultAspect} • {state.captionStyle}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}