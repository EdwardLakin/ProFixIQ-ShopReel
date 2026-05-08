"use client";
import Link from "next/link";
import { AiCommandCenter, AiIntentChip, AiWorkspaceStage } from "@/features/shopreel/ui/system/AiCommandPrimitives";

export default function HomeCommandClient({ recent }: { recent: Array<{ id: string; title: string; status: string }> }) {
  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
    <div className="space-y-4">
      <AiWorkspaceStage title="AI Command Center">
        <h1 className="text-4xl font-semibold">Hi, what are we working on today?</h1>
        <p className="mt-2 text-sm text-white/65">Tell ShopReel intent and route to the right workspace while keeping manual review controls intact.</p>
        <div className="mt-4"><AiCommandCenter examples={["Show me my latest work","Continue the campaign we were working on","Create a reel from these uploads","Show campaign data for PayProof","Check renders that need attention","Package ready assets for publishing"]} /></div>
        <div className="mt-4 flex flex-wrap gap-2">{[["Create","/shopreel/create"],["Continue latest","/shopreel/generations"],["Campaigns","/shopreel/campaigns"],["Render queue","/shopreel/render-queue"],["Library","/shopreel/library"],["Publish/export","/shopreel/exports"],["Ideas","/shopreel/ideas"]].map(([l,h]) => <AiIntentChip key={String(h)} label={String(l)} href={String(h)} />)}</div>
      </AiWorkspaceStage>
      <AiWorkspaceStage title="Latest Activity">
        {recent.length === 0 ? <div className="text-sm text-white/60">No persisted activity yet. Start by creating a draft or uploading media into Library.</div> : <div className="space-y-2">{recent.map((r) => <Link key={r.id} href={`/shopreel/generations/${r.id}`} className="block rounded-xl bg-white/5 px-3 py-2 text-sm text-white/80">{r.title} · {r.status}</Link>)}</div>}
      </AiWorkspaceStage>
    </div>
    <AiWorkspaceStage title="System Status"><div className="space-y-2 text-sm text-white/70"><div>AI routing: deterministic interpreter (local)</div><div>Publish authority: manual operator review</div><div>Autonomous publish: disabled</div></div></AiWorkspaceStage>
  </div>;
}
