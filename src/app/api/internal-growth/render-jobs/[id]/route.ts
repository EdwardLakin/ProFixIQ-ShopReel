import { NextResponse } from "next/server";
import { assertInternalGrowthAccess } from "@/features/internal-growth/server/guards";
import { getRenderJob } from "@/features/internal-growth/server/repository";

export async function GET(_: Request, { params }: { params: { id: string } }) { await assertInternalGrowthAccess(); return NextResponse.json(await getRenderJob(params.id)); }
