import type { Database } from "@/types/supabase";

type ShopScopedTable = keyof Database["public"]["Tables"];

export function getShopScopeColumnForTable(table: ShopScopedTable): "shop_id" | "tenant_shop_id" {
  switch (table) {
    case "content_pieces":
    case "content_publications":
      return "tenant_shop_id";
    default:
      return "shop_id";
  }
}
