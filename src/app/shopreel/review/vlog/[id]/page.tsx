import { redirect } from "next/navigation";

export default async function ShopReelVlogReviewRedirect(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  redirect(`/shopreel/generations/${id}`);
}
