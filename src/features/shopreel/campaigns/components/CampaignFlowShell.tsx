import type { ReactNode } from "react";

type CampaignFlowShellProps = {
  children: ReactNode;
};

export default function CampaignFlowShell({
  children,
}: CampaignFlowShellProps) {
  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_42%),linear-gradient(180deg,#071120_0%,#06101d_38%,#050914_100%)]">
      <div className="mx-auto w-full max-w-[1320px] px-3 pb-12 pt-4 sm:px-4 md:px-6 md:pb-14 lg:px-8 lg:pt-6">
        {children}
      </div>
    </div>
  );
}
