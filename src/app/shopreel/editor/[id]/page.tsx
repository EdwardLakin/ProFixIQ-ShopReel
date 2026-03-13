import { redirect } from "next/navigation";

export default async function ShopReelEditorPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  redirect(`/shopreel/editor/video/${id}`);
}
