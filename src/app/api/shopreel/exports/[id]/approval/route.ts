import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const ALLOWED: Record<string, string[]> = {
  draft: ["needs_review"],
  needs_review: ["approved"],
  approved: ["exported"],
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { toState?: string };
  const toState = body.toState;
  if (!toState) return NextResponse.json({ error: "Missing toState" }, { status: 400 });
  const supabase = createAdminClient();
  const { data: row } = await supabase.from("shopreel_export_packages").select("id, checklist").eq("id", id).maybeSingle();
  if (!row) return NextResponse.json({ error: "Package not found" }, { status: 404 });
  const metadata = row.checklist && typeof row.checklist === "object" && !Array.isArray(row.checklist) ? (row.checklist as Record<string, unknown>) : {};
  const current = typeof metadata.approval_state === "string" ? metadata.approval_state : "draft";
  if (!(ALLOWED[current] ?? []).includes(toState)) return NextResponse.json({ error: `Invalid transition ${current} -> ${toState}` }, { status: 400 });
  const nextMeta = { ...metadata, approval_state: toState, approval_updated_at: new Date().toISOString() };
  await supabase.from("shopreel_export_packages").update({ checklist: nextMeta, status: toState === "approved" ? "ready" : toState === "exported" ? "exported" : "draft" }).eq("id", id);
  return NextResponse.json({ ok: true, toState });
}
