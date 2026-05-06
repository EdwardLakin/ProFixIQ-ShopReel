import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import BillingPageClient from "@/features/billing/components/BillingPageClient";
import { ShopReelPageHero } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";

export default function ShopReelBillingPage() {
  return (
    <GlassShell title="Billing" hidePageIntro>
      <div className="space-y-5">
        <ShopReelPageHero
          title="Billing"
          subtitle="Choose a plan, start checkout, or manage your ShopReel subscription. Ideas and previews stay easy; premium actions unlock through billing."
          actions={[
            { label: "Back to Create", href: "/shopreel/create" },
            { label: "Open Settings", href: "/shopreel/settings" },
          ]}
        />
        <BillingPageClient />
      </div>
    </GlassShell>
  );
}
