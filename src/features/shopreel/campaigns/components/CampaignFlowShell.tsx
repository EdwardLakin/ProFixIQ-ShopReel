import type { ReactNode } from "react";

type CampaignFlowShellProps = {
  children: ReactNode;
};

export default function CampaignFlowShell({
  children,
}: CampaignFlowShellProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 md:px-6 lg:px-8">
      {children}
    </div>
  );
}
