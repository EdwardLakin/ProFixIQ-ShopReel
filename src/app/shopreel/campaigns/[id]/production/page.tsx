import { redirect } from "next/navigation";

export default async function ShopReelCampaignProductionRedirectPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  redirect(`/shopreel/campaigns/${id}`);
}
