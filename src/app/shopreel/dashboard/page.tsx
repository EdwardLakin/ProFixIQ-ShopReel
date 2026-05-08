export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default function ShopReelLegacyDashboardRedirectPage() {
  redirect("/shopreel");
}
