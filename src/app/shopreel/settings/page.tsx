import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import { Suspense } from "react";
import Link from "next/link";
import ShopReelSettingsClient from "@/features/shopreel/ui/ShopReelSettingsClient";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";

export default function ShopReelSettingsPage() {
  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Settings"
      subtitle="Canonical workspace settings for channels, publishing defaults, and automation behavior."
      actions={
        <Link href="/shopreel/account">
          <GlassButton variant="ghost">Workspace details</GlassButton>
        </Link>
      }
    >
      <ShopReelNav />
      <Suspense fallback={null}><ShopReelSettingsClient /></Suspense>
    </GlassShell>
  );
}
