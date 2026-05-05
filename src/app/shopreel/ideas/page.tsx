import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import IdeasChatClient from "@/features/shopreel/ideas/components/IdeasChatClient";
import { ShopReelPageHero } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";

export default function ShopReelIdeasPage() {
  return (
    <GlassShell title="Ideas" hidePageIntro>
      <div className="space-y-5">
        <ShopReelPageHero
          title="Ideas"
          subtitle="Brainstorm angles, hooks, campaigns, and content concepts with ShopReel AI before sending the best idea into Create."
          actions={[
            { label: "Create content", href: "/shopreel/create", primary: true },
            { label: "View projects", href: "/shopreel/generations" },
          ]}
        />
        <IdeasChatClient />
      </div>
    </GlassShell>
  );
}
