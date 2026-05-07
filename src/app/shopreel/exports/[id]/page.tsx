export const dynamic = "force-dynamic";
import { createAdminClient } from "@/lib/supabase/server";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import { mapExportPackage } from "@/features/shopreel/export/exportPackage";
import { computePublishReadiness } from "@/features/shopreel/publish/lifecycle";
import PackageDetailClient from "./PackageDetailClient";

export default async function ExportPackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: row } = await supabase.from("shopreel_export_packages").select("*").eq("id", id).maybeSingle();
  if (!row) return <GlassShell title="Package not found"><div /></GlassShell>;
  const pkg = mapExportPackage(row);
  const metadata = row.checklist && typeof row.checklist === "object" && !Array.isArray(row.checklist) ? (row.checklist as Record<string, unknown>) : {};
  const approval = typeof metadata.approval_state === "string" ? metadata.approval_state : "draft";
  const readiness = computePublishReadiness({ videoUrl: pkg.mp4Path, thumbnailUrl: pkg.thumbnailPath, captionText: pkg.captionText, title: undefined, description: undefined, hashtags: pkg.hashtags, targets: pkg.platformOutputs.map((p) => ({ platformId: p.platformId, label: p.platformId })) });

  return <GlassShell title={`Package ${pkg.id.slice(0, 8)}`} subtitle="Operational publish package detail.">
    <div className="space-y-4 text-sm text-white/80">
      <div className="rounded-xl border border-white/10 bg-black/30 p-3">Readiness: {readiness.status} · blockers {readiness.blockerCount} · warnings {readiness.warningCount} · approval {approval}</div>
      <div className="rounded-xl border border-white/10 bg-black/30 p-3">Assets: video {pkg.mp4Path ? "available" : "missing"} · thumbnail {pkg.thumbnailPath ? "available" : "missing"}</div>
      <div className="rounded-xl border border-white/10 bg-black/30 p-3">Metadata: caption {pkg.captionText ? "available" : "missing"} · hashtags {pkg.hashtags.length} · targets {pkg.platformOutputs.length}</div>
      <PackageDetailClient id={pkg.id} caption={pkg.captionText} hashtags={pkg.hashtags} approvalState={approval} hasVideo={Boolean(pkg.mp4Path)} hasThumb={Boolean(pkg.thumbnailPath)} videoUrl={pkg.mp4Path} thumbUrl={pkg.thumbnailPath} />
    </div>
  </GlassShell>;
}
