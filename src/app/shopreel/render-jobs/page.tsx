export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default function ShopReelRenderJobsCompatPage() {
  redirect("/shopreel/render-queue");
}
