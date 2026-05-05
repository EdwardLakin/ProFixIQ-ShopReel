export const dynamic = "force-dynamic";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { requireShopId } from "@/features/shopreel/server/requireShopId";
import { mapExportPackage } from "@/features/shopreel/export/exportPackage";
import CopyButton from "@/features/shopreel/export/components/CopyButton";

export default async function ShopReelExportsPage() {
  const shopId = await requireShopId();
  const supabase = createAdminClient();
  const { data } = await supabase.from("shopreel_export_packages").select("*").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(100);
  const items = (data ?? []).map(mapExportPackage);
  return <section className="mx-auto w-full max-w-5xl px-4 py-10 text-white"><h1 className="text-2xl font-semibold">Exports</h1><p className="mt-2 text-sm text-white/75">Manual export packages for rendered reels.</p>
  <div className="mt-5 grid gap-4">{items.length===0?<div className="rounded border border-white/15 p-3 text-sm">No export packages yet. <Link className="underline" href="/shopreel/render-jobs">Open Render Jobs</Link></div>:items.map((pkg)=><div key={pkg.id} className="rounded border border-white/15 p-4 text-sm space-y-2"><div className="flex justify-between"><div className="font-medium">Package {pkg.id.slice(0,8)}</div><div>{pkg.status}</div></div><div>MP4: {pkg.mp4Path?<a className="underline" href={pkg.mp4Path} target="_blank">Open download</a>:"Missing"}</div><div>Thumbnail: {pkg.thumbnailPath?<a className="underline" href={pkg.thumbnailPath} target="_blank">Open thumbnail</a>:"Missing"}</div><div>Caption: {pkg.captionText ?? "—"}</div><CopyButton label="Copy caption" value={pkg.captionText ?? ""} /><div>Hashtags: {pkg.hashtags.join(" ") || "—"}</div><CopyButton label="Copy hashtags" value={pkg.hashtags.join(" ")} /><ul className="list-disc pl-5">{pkg.platformOutputs.flatMap((o)=>o.checklist.map((c)=>`${o.platformId}: ${c}`)).map((c)=><li key={c}>{c}</li>)}</ul><form action={`/api/shopreel/export-packages/${pkg.id}/mark-exported`} method="post"><button className="rounded border border-white/20 px-2 py-1">Mark exported</button></form></div>)}</div>
  </section>;
}
