import { NextResponse } from "next/server";
import { markNotificationRead } from "@/features/shopreel/notifications/server";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const data = await markNotificationRead(id);
    return NextResponse.json({ ok: true, notification: data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to mark read" }, { status: 500 });
  }
}
