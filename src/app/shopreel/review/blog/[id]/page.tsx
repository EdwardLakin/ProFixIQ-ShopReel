import { redirect } from "next/navigation";

export default async function ShopReelBlogReviewRedirect(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  redirect(`/shopreel/generations/${id}`);
}
