import { NextRequest, NextResponse } from "next/server";
import { assertInternalGrowthAccess } from "@/features/internal-growth/server/guards";
import { createRenderJob, listRenderJobs } from "@/features/internal-growth/server/repository";

export async function GET() { await assertInternalGrowthAccess(); return NextResponse.json({ jobs: await listRenderJobs() }); }
export async function POST(req: NextRequest) { await assertInternalGrowthAccess(); const body = await req.json() as { compositionId?: string; provider?: string }; if (!body.compositionId) return NextResponse.json({ error: "compositionId required" }, { status: 400 }); return NextResponse.json(await createRenderJob(body.compositionId, body.provider)); }
