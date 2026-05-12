export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default async function ShopReelVlogReviewPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  redirect(`/shopreel/review/${id}?source=vlog`);
}
