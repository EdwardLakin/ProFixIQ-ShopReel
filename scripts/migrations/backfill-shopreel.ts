import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const source = createClient(
  process.env.PROFIXIQ_SUPABASE_URL!,
  process.env.PROFIXIQ_SERVICE_ROLE_KEY!,
);

const target = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const TABLES = [
  "content_templates",
  "content_calendars",
  "content_assets",
  "content_pieces",
  "content_calendar_items",
  "content_events",
  "content_platform_accounts",
  "content_publications",
  "content_analytics_events",
] as const;

type TableName = (typeof TABLES)[number];
type Row = Record<string, unknown>;

const ALLOWED_COLUMNS: Record<TableName, string[]> = {
  content_templates: [
    "id",
    "tenant_shop_id",
    "source_shop_id",
    "source_system",
    "name",
    "slug",
    "description",
    "is_active",
    "config",
    "created_at",
    "updated_at",
  ],
  content_calendars: [
    "id",
    "tenant_shop_id",
    "source_shop_id",
    "source_system",
    "name",
    "description",
    "timezone",
    "settings",
    "created_at",
    "updated_at",
  ],
  content_assets: [
    "id",
    "tenant_shop_id",
    "source_shop_id",
    "source_vehicle_id",
    "source_work_order_id",
    "source_inspection_id",
    "source_media_upload_id",
    "source_inspection_photo_id",
    "source_system",
    "asset_type",
    "title",
    "caption",
    "bucket",
    "storage_path",
    "public_url",
    "mime_type",
    "duration_seconds",
    "file_size_bytes",
    "metadata",
    "created_at",
    "updated_at",
  ],
  content_pieces: [
    "id",
    "tenant_shop_id",
    "source_shop_id",
    "source_vehicle_id",
    "source_work_order_id",
    "source_inspection_id",
    "source_media_upload_id",
    "source_inspection_photo_id",
    "source_system",
    "template_id",
    "title",
    "hook",
    "caption",
    "cta",
    "script_text",
    "voiceover_text",
    "status",
    "content_type",
    "platform_targets",
    "render_url",
    "thumbnail_url",
    "metadata",
    "published_at",
    "created_at",
    "updated_at",
  ],
  content_calendar_items: [
    "id",
    "tenant_shop_id",
    "source_shop_id",
    "source_system",
    "calendar_id",
    "content_piece_id",
    "scheduled_for",
    "status",
    "metadata",
    "created_at",
    "updated_at",
  ],
  content_events: [
    "id",
    "tenant_shop_id",
    "source_shop_id",
    "source_vehicle_id",
    "source_work_order_id",
    "source_inspection_id",
    "source_media_upload_id",
    "source_inspection_photo_id",
    "source_system",
    "content_piece_id",
    "event_type",
    "payload",
    "occurred_at",
    "created_at",
  ],
  content_platform_accounts: [
    "id",
    "tenant_shop_id",
    "source_shop_id",
    "source_system",
    "platform",
    "platform_account_id",
    "platform_username",
    "access_token",
    "refresh_token",
    "token_expires_at",
    "connection_active",
    "metadata",
    "created_at",
    "updated_at",
  ],
  content_publications: [
    "id",
    "tenant_shop_id",
    "source_shop_id",
    "source_system",
    "content_piece_id",
    "platform_account_id",
    "platform",
    "status",
    "scheduled_for",
    "published_at",
    "platform_post_id",
    "platform_post_url",
    "error_text",
    "metadata",
    "created_at",
    "updated_at",
  ],
  content_analytics_events: [
    "id",
    "tenant_shop_id",
    "source_shop_id",
    "source_system",
    "content_piece_id",
    "publication_id",
    "platform",
    "event_name",
    "event_value",
    "payload",
    "occurred_at",
    "created_at",
  ],
};

function pick<T extends Row>(row: T, keys: string[]) {
  const out: Row = {};
  for (const key of keys) {
    if (row[key] !== undefined) out[key] = row[key];
  }
  return out;
}

function transformRow(table: TableName, row: Row): Row | null {
  const shopId =
    (row.tenant_shop_id as string | null) ??
    (row.shop_id as string | null) ??
    (row.source_shop_id as string | null) ??
    null;

  const base: Row = {
    ...row,
    tenant_shop_id: shopId,
    source_shop_id: (row.source_shop_id as string | null) ?? shopId,
    source_system: (row.source_system as string | null) ?? "profixiq",
  };

  if (table === "content_templates") {
    base.config = (row.config as unknown) ?? (row.metadata as unknown) ?? {};
    base.is_active = (row.is_active as boolean | null) ?? true;
  }

  if (table === "content_calendars") {
  base.name =
    (row.name as string | null) ??
    (row.slug as string | null) ??
    "Default Calendar";
  base.settings = (row.settings as unknown) ?? {};
}

  if (table === "content_assets") {
    base.metadata = (row.metadata as unknown) ?? {};
    base.asset_type = (row.asset_type as string | null) ?? "other";
  }

  if (table === "content_pieces") {
    base.metadata = (row.metadata as unknown) ?? {};
    base.platform_targets = (row.platform_targets as unknown) ?? [];
    base.status = (row.status as string | null) ?? "draft";
  }

  if (table === "content_calendar_items") {
    if (!row.content_piece_id) {
      return null;
    }
    base.metadata = (row.metadata as unknown) ?? {};
    base.status = (row.status as string | null) ?? "scheduled";
  }

  if (table === "content_events") {
    base.event_type =
      (row.event_type as string | null) ??
      (row.type as string | null) ??
      "legacy_event";

    base.payload = (row.payload as unknown) ?? {};

    base.occurred_at =
      (row.occurred_at as string | null) ??
      (row.created_at as string | null) ??
      new Date().toISOString();
  }

  if (table === "content_platform_accounts") {
    base.metadata = (row.metadata as unknown) ?? {};
    base.connection_active =
      (row.connection_active as boolean | null) ?? false;
  }

  if (table === "content_publications") {
    if (!row.content_piece_id) {
      return null;
    }

    base.metadata = (row.metadata as unknown) ?? {};
    base.status = (row.status as string | null) ?? "draft";
  }

  if (table === "content_analytics_events") {
    base.payload = (row.payload as unknown) ?? {};
    base.occurred_at =
      (row.occurred_at as string | null) ??
      (row.created_at as string | null) ??
      new Date().toISOString();
  }

  return pick(base, ALLOWED_COLUMNS[table]);
}

async function backfillTable(table: TableName) {
  let from = 0;
  const batchSize = 500;

  while (true) {
    const { data, error } = await source
      .from(table)
      .select("*")
      .order("created_at", { ascending: true })
      .range(from, from + batchSize - 1);

    if (error) throw new Error(`${table} source read failed: ${error.message}`);
    if (!data || data.length === 0) break;

    const rows = data
  .map((row) => transformRow(table, row as Row))
  .filter((row): row is Row => row !== null);

if (rows.length === 0) {
  from += data.length;
  continue;
}

    const { error: upsertError } = await target
      .from(table)
      .upsert(rows, { onConflict: "id" });

    if (upsertError) {
      throw new Error(`${table} target upsert failed: ${upsertError.message}`);
    }

    console.log(`[backfill] ${table}: ${from} -> ${from + rows.length - 1}`);
    from += rows.length;
  }
}

async function main() {
  for (const table of TABLES) {
    console.log(`[start] ${table}`);
    await backfillTable(table);
    console.log(`[done] ${table}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
