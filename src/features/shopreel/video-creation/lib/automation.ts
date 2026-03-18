import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export async function syncAllProcessingVideoJobs() {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: jobs, error } = await supabase
    .from("shopreel_media_generation_jobs")
    .select("id, provider, job_type, status")
    .eq("shop_id", shopId)
    .eq("status", "processing")
    .eq("provider", "openai")
    .eq("job_type", "video")
    .order("updated_at", { ascending: true })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL?.startsWith("http")
      ? process.env.VERCEL_URL
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

  const results: Array<{
    jobId: string;
    ok: boolean;
    status?: number;
    error?: string;
  }> = [];

  for (const job of jobs ?? []) {
    try {
      const res = await fetch(`${baseUrl}/api/shopreel/video-creation/jobs/${job.id}/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        results.push({
          jobId: job.id,
          ok: false,
          status: res.status,
          error: text || "Sync request failed",
        });
        continue;
      }

      results.push({
        jobId: job.id,
        ok: true,
        status: res.status,
      });
    } catch (error) {
      results.push({
        jobId: job.id,
        ok: false,
        error: error instanceof Error ? error.message : "Unknown sync error",
      });
    }
  }

  return results;
}
