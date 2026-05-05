import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import { Suspense } from "react";
import ShopReelSettingsClient from "@/features/shopreel/ui/ShopReelSettingsClient";
import { ShopReelActionRail, ShopReelPageHero, ShopReelSurface } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";

export default function ShopReelSettingsPage() {
  return (
    <GlassShell title="Settings" hidePageIntro>
      <div className="space-y-4">
        <ShopReelPageHero title="Settings" subtitle="Manage brand voice, audience defaults, format preferences, channels, automation, and workspace details." actions={[{label:"Workspace details",href:"/shopreel/account",primary:true}]} />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]"><ShopReelSurface title="Brand and workspace configuration"><Suspense fallback={null}><ShopReelSettingsClient /></Suspense></ShopReelSurface><ShopReelActionRail title="Setup checklist" items={["Brand voice defined","Default aspect ratio selected","Channels connected","Automation reviewed"]}/></div>
      </div>
    </GlassShell>
  );
}
