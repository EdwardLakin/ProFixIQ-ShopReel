import { NextResponse } from "next/server";
import { listNotificationsForCurrentUser } from "@/features/shopreel/notifications/server";

export async function GET() {
  try {
    const data = await listNotificationsForCurrentUser(25);
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to list notifications" }, { status: 500 });
  }
}
