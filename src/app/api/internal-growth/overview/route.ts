import { NextResponse } from "next/server";
import { requireGrowthAgentOwnerContext } from "@/features/internal-growth/server/guards";
import { overview } from "@/features/internal-growth/server/repository";
import { toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";
export async function GET() { try { await requireGrowthAgentOwnerContext(); return NextResponse.json(await overview()); } catch (error) { return toEndpointErrorResponse(error, "Failed to load overview"); }}
