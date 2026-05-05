export const dynamic = "force-dynamic";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { requireShopId } from "@/features/shopreel/server/requireShopId";
import { mapExportPackage } from "@/features/shopreel/export/exportPackage";
import CopyButton from "@/features/shopreel/export/components/CopyButton";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";

export default async function ShopReelDownloadsPage() {
  const shopId = await requireShopId();
  const supabase = createAdminClient();
  const { data } = await supabase.from("shopreel_export_packages").select("*").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(100);
  const items = (data ?? []).map(mapExportPackage);
  return (
    <GlassShell
      eyebrow="Downloads"
      title="Downloads"
      subtitle="Export-ready packages and files appear here after a project is processed."
      actions={<Link href="/shopreel/create"><GlassButton variant="primary">Create content</GlassButton></Link>}
    >
      <GlassCard title="Completed export packages" description="Download media, copy captions and hashtags, and track export handoff." strong>
        <div className="grid gap-4">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 text-sm text-white/80">
              No downloads yet. Generate and process a draft to create your first export package. <Link className="underline" href="/shopreel/render-jobs">Open Processing</Link>
            </div>
          ) : items.map((pkg) => (
            <div key={pkg.id} className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 text-sm space-y-2">
              <div className="flex justify-between"><div className="font-medium">Package {pkg.id.slice(0, 8)}</div><GlassBadge tone="default">{pkg.status}</GlassBadge></div>
              <div>MP4: {pkg.mp4Path ? <a className="underline" href={pkg.mp4Path} target="_blank" rel="noreferrer">Open download</a> : "Missing"}</div>
              <div>Thumbnail: {pkg.thumbnailPath ? <a className="underline" href={pkg.thumbnailPath} target="_blank" rel="noreferrer">Open thumbnail</a> : "Missing"}</div>
              <div>Caption: {pkg.captionText ?? "—"}</div><CopyButton label="Copy caption" value={pkg.captionText ?? ""} /><div>Hashtags: {pkg.hashtags.join(" ") || "—"}</div><CopyButton label="Copy hashtags" value={pkg.hashtags.join(" ")} /><ul className="list-disc pl-5">{pkg.platformOutputs.flatMap((o) => o.checklist.map((c) => `${o.platformId}: ${c}`)).map((c) => <li key={c}>{c}</li>)}</ul><form action={`/api/shopreel/export-packages/${pkg.id}/mark-exported`} method="post"><button className="rounded border border-white/20 px-2 py-1">Mark exported</button></form>
            </div>
          ))}
        </div>
      </GlassCard>
    </GlassShell>
  );
}
