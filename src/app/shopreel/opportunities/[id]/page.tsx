import { notFound } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassNav from "@/features/shopreel/ui/system/GlassNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";

type Params = {
  params: Promise<{ id: string }>;
};

type VideoRow = {
  id: string;
  shop_id: string;
  title: string;
  status: string;
  content_type: string;
  hook: string | null;
  caption: string | null;
  cta: string | null;
  script_text: string | null;
  voiceover_text: string | null;
  platform_targets: string[] | null;
  ai_score: number | null;
  source_asset_id: string | null;
  render_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

type ShopUserLite = {
  shop_id: string;
};

const DEFAULT_SHOP_ID = "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

function formatStatus(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatContentType(contentType: string) {
  return contentType.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function resolveShopId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return DEFAULT_SHOP_ID;

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("shop_users")
    .select("shop_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return (membership as ShopUserLite | null)?.shop_id ?? DEFAULT_SHOP_ID;
}

export default async function ShopReelOpportunityDetailPage({ params }: Params) {
  const { id } = await params;
  const shopId = await resolveShopId();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("videos")
    .select(
      "id, shop_id, title, status, content_type, hook, caption, cta, script_text, voiceover_text, platform_targets, ai_score, source_asset_id, render_url, thumbnail_url, created_at"
    )
    .eq("id", id)
    .eq("shop_id", shopId)
    .maybeSingle();

  const video = data as VideoRow | null;

  if (error || !video) {
    notFound();
  }

  return (
    <GlassShell
      eyebrow="ShopReel"
      title={video.title}
      subtitle="Review the generated concept before rendering or publishing."
      actions={
        <div className="flex flex-wrap gap-3">
          <GlassButton variant="secondary">Queue render</GlassButton>
          <GlassButton variant="primary">Publish</GlassButton>
        </div>
      }
    >
      <GlassNav />

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard
          label="Overview"
          title="Opportunity summary"
          description="Review the generated concept, source, and current state."
        >
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <GlassBadge tone={video.source_asset_id ? "copper" : "default"}>
                {video.source_asset_id ? "Manual Upload" : "Shop Data"}
              </GlassBadge>
              <GlassBadge tone="default">{formatStatus(video.status)}</GlassBadge>
              <GlassBadge tone="muted">{formatContentType(video.content_type)}</GlassBadge>
              <GlassBadge tone="muted">
                Score {video.ai_score != null ? Math.round(video.ai_score) : "--"}
              </GlassBadge>
            </div>

            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4">
              <div className="text-sm text-[color:rgba(243,237,230,0.62)]">Hook</div>
              <div className="mt-1 text-base font-medium text-[color:#f3ede6]">
                {video.hook ?? "No hook generated"}
              </div>
            </div>

            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4">
              <div className="text-sm text-[color:rgba(243,237,230,0.62)]">Caption</div>
              <div className="mt-1 text-sm leading-6 text-[color:#f3ede6]">
                {video.caption ?? "No caption generated"}
              </div>
            </div>

            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4">
              <div className="text-sm text-[color:rgba(243,237,230,0.62)]">CTA</div>
              <div className="mt-1 text-sm leading-6 text-[color:#f3ede6]">
                {video.cta ?? "No CTA generated"}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard
          label="Delivery"
          title="Assets and output"
          description="Use this area to review render readiness and output metadata."
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4">
              <div className="text-sm text-[color:rgba(243,237,230,0.62)]">Created</div>
              <div className="mt-1 text-base font-medium text-[color:#f3ede6]">
                {new Date(video.created_at).toLocaleString()}
              </div>
            </div>

            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4">
              <div className="text-sm text-[color:rgba(243,237,230,0.62)]">Platform targets</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(video.platform_targets ?? []).length > 0 ? (
                  (video.platform_targets ?? []).map((platform) => (
                    <GlassBadge key={platform} tone="default">
                      {platform}
                    </GlassBadge>
                  ))
                ) : (
                  <span className="text-sm text-[color:rgba(243,237,230,0.62)]">
                    No platform targets set
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4">
              <div className="text-sm text-[color:rgba(243,237,230,0.62)]">Render output</div>
              <div className="mt-1 text-sm text-[color:#f3ede6]">
                {video.render_url ? "Render available" : "No render output yet"}
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <GlassCard
          label="Script"
          title="Script text"
          description="Generated long-form concept text for review."
        >
          <div className="whitespace-pre-wrap text-sm leading-6 text-[color:#f3ede6]">
            {video.script_text ?? "No script text generated"}
          </div>
        </GlassCard>

        <GlassCard
          label="Voiceover"
          title="Voiceover text"
          description="Generated spoken version used for reel planning."
        >
          <div className="whitespace-pre-wrap text-sm leading-6 text-[color:#f3ede6]">
            {video.voiceover_text ?? "No voiceover text generated"}
          </div>
        </GlassCard>
      </section>
    </GlassShell>
  );
}
