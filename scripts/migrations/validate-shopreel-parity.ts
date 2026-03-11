import "dotenv/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

async function countRows(client: SupabaseClient, table: TableName) {
  const { count, error } = await (client as SupabaseClient)
    .from(table as string)
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(`${table} count failed: ${error.message}`);
  }

  return count ?? 0;
}

async function main() {
  let hasMismatch = false;

  for (const table of TABLES) {
    const sourceCount = await countRows(source, table);
    const targetCount = await countRows(target, table);
    const ok = sourceCount === targetCount;

    console.log(
      `${ok ? "OK" : "MISMATCH"} ${table} source=${sourceCount} target=${targetCount}`,
    );

    if (!ok) {
      hasMismatch = true;
    }
  }

  process.exit(hasMismatch ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});