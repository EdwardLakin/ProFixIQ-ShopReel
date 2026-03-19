import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { getBaseUrl } from "@/features/shopreel/lib/getBaseUrl";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const supabase = createAdminClient();
    const shopId = await getCurrentShopId();

    const { data: item, error: itemError } = await supabase
      .from("shopreel_campaign_items")
      .select("id, campaign_id, shop_id")
      .eq("id", id)
      .eq("shop_id", shopId)
      .single();

    if (itemError || !item) {
      throw new Error(itemError?.message ?? "Campaign item not found");
    }

    const baseUrl = getBaseUrl();

    const workerRes = await fetch(`${baseUrl}/api/shopreel/premium-worker`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-shopreel-worker-secret":
          process.env.SHOPREEL_PREMIUM_ASSEMBLY_SECRET ?? "",
      },
      body: JSON.stringify({ itemId: item.id }),
    });

    const workerJson = await workerRes.json().catch(() => ({}));

    if (!workerRes.ok || workerJson?.ok === false) {
      throw new Error(workerJson?.error ?? "Premium worker failed");
    }

    revalidatePath(`/shopreel/campaigns/${item.campaign_id}`);
    revalidatePath(`/shopreel/campaigns/items/${item.id}`);

    return NextResponse.json({
      ok: true,
      result: workerJson.result ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to assemble premium campaign item",
      },
      { status: 500 }
    );
  }
}
