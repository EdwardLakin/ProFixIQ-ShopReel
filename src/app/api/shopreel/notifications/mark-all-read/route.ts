import { NextResponse } from "next/server";
import { markAllNotificationsRead } from "@/features/shopreel/notifications/server";

export async function POST() {
  try {
    await markAllNotificationsRead();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to mark all read" }, { status: 500 });
  }
}
