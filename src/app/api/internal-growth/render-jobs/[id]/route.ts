import { NextResponse } from "next/server";
import { assertInternalGrowthAccess } from "@/features/internal-growth/server/guards";
import { getRenderJob } from "@/features/internal-growth/server/repository";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { await assertInternalGrowthAccess(); return NextResponse.json(await getRenderJob((await params).id)); }
