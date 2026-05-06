import { createAdminClient, createClient } from "@/lib/supabase/server";
import { requireUserActionTenantContext } from "@/features/shopreel/server/endpointPolicy";

type NotificationSeverity = "info" | "success" | "warning" | "error";
type NotificationStatus = "unread" | "read" | "archived";

import type { Json } from "@/types/supabase";

type JsonObject = Record<string, unknown>;

export type EmitShopReelNotificationInput = {
  userId?: string | null;
  shopId?: string | null;
  type: string;
  title: string;
  body?: string | null;
  severity?: NotificationSeverity;
  entityType?: string | null;
  entityId?: string | null;
  actionLabel?: string | null;
  actionHref?: string | null;
  metadata?: JsonObject;
};

export async function emitShopReelNotification(input: EmitShopReelNotificationInput) {
  if (!input.userId && !input.shopId) {
    throw new Error("[emitShopReelNotification] userId or shopId is required");
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shopreel_notifications")
    .insert({
      user_id: input.userId ?? null,
      shop_id: input.shopId ?? null,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      severity: input.severity ?? "info",
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      action_label: input.actionLabel ?? null,
      action_href: input.actionHref ?? null,
      metadata: (input.metadata ?? {}) as Json,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function emitShopReelNotificationForUser(input: Omit<EmitShopReelNotificationInput, "userId"> & { userId: string }) {
  return emitShopReelNotification(input);
}

export async function emitShopReelNotificationForShop(input: Omit<EmitShopReelNotificationInput, "shopId"> & { shopId: string }) {
  return emitShopReelNotification(input);
}

export async function listNotificationsForCurrentUser(limit = 20) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) return { items: [], unreadCount: 0 };

  const tenant = await requireUserActionTenantContext();

  const { data, error } = await supabase
    .from("shopreel_notifications")
    .select("*")
    .or(`user_id.eq.${userId},and(shop_id.eq.${tenant.shopId},user_id.is.null)`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const unreadCount = (data ?? []).filter((item) => item.status === "unread").length;
  return { items: data ?? [], unreadCount };
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("shopreel_notifications")
    .update({ status: "read" satisfies NotificationStatus, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) {
    throw new Error("Authentication required");
  }

  const { error } = await supabase
    .from("shopreel_notifications")
    .update({ status: "read" satisfies NotificationStatus, read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "unread");

  if (error) throw error;
  return { ok: true };
}
