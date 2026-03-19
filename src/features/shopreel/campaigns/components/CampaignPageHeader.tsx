"use client";

import Link from "next/link";

type CampaignPageHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  rightSlot?: React.ReactNode;
};

export default function CampaignPageHeader({
  title,
  subtitle,
  backHref = "/shopreel/campaigns",
  backLabel = "Back",
  rightSlot,
}: CampaignPageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="mb-2">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <span aria-hidden="true">←</span>
            <span>{backLabel}</span>
          </Link>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-2 max-w-3xl text-sm text-white/70 md:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>

      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </div>
  );
}
