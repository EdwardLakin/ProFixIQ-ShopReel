export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default async function ShopReelCampaignReviewRedirectPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  redirect(`/shopreel/campaigns/${id}?panel=review`);
}
