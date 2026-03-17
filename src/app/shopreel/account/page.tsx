import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { getShopReelSettings } from "@/features/shopreel/settings/getShopReelSettings";

type ShopUserRow = {
  id?: string | null;
  user_id?: string | null;
  shop_id?: string | null;
  role?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

type PlatformAccountRow = {
  id: string;
  platform: string;
  platform_account_id: string | null;
  platform_username: string | null;
  connection_active: boolean | null;
  token_expires_at: string | null;
  updated_at: string | null;
  metadata: Record<string, unknown> | null;
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function readAccountLabel(row: PlatformAccountRow) {
  const metadata = row.metadata ?? {};
  const metaPageName =
    typeof metadata.meta_page_name === "string" ? metadata.meta_page_name : null;

  return row.platform_username ?? metaPageName ?? row.platform_account_id ?? "Connected account";
}

export default async function ShopReelAccountPage() {
  const appSupabase = await createClient();
  const admin = createAdminClient();
  const shopId = await getCurrentShopId();
  const settings = await getShopReelSettings(shopId);

  const {
    data: { user },
  } = await appSupabase.auth.getUser();

  const { data: membershipRowsData } = await (admin as any)
    .from("shop_users")
    .select("id, user_id, shop_id, role, is_active, created_at")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: true });

  const memberships = ((membershipRowsData ?? []) as ShopUserRow[]).filter(
    (row) => row.is_active !== false,
  );

  const { data: accountRowsData } = await (admin as any)
    .from("content_platform_accounts")
    .select(
      "id, platform, platform_account_id, platform_username, connection_active, token_expires_at, updated_at, metadata",
    )
    .eq("tenant_shop_id", shopId)
    .order("platform", { ascending: true });

  const accounts = (accountRowsData ?? []) as PlatformAccountRow[];

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Workspace"
      subtitle="Current shop context, active memberships, and connected publishing accounts."
    >
      <ShopReelNav />

      <section className="grid gap-5 lg:grid-cols-3">
        <GlassCard
          label="Profile"
          title="Signed-in user"
          description="Current authenticated ShopReel user context."
          strong
        >
          <div className="space-y-3">
            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                Email
              </div>
              <div className={cx("mt-2 text-sm break-all", glassTheme.text.primary)}>
                {user?.email ?? "Not signed in"}
              </div>
            </div>

            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                User ID
              </div>
              <div className={cx("mt-2 text-sm break-all", glassTheme.text.primary)}>
                {user?.id ?? "—"}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard
          label="Shop"
          title="Current shop"
          description="Resolved shop context used by ShopReel routes and workers."
          strong
        >
          <div className="space-y-3">
            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.copper,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                Shop ID
              </div>
              <div className={cx("mt-2 text-sm break-all", glassTheme.text.primary)}>{shopId}</div>
            </div>

            <div className="flex flex-wrap gap-2">
              <GlassBadge tone="default">
                {settings.readiness.enabledCount} enabled platform
                {settings.readiness.enabledCount === 1 ? "" : "s"}
              </GlassBadge>
              <GlassBadge tone="copper">
                {settings.readiness.connectedCount} connected
              </GlassBadge>
              <GlassBadge tone={settings.readiness.canAutopilot ? "copper" : "muted"}>
                {settings.readiness.canAutopilot ? "Autopilot ready" : "Manual mode"}
              </GlassBadge>
            </div>
          </div>
        </GlassCard>

        <GlassCard
          label="Readiness"
          title="Launch checklist"
          description="What still blocks full autopilot publishing."
          strong
        >
          {settings.readiness.missing.length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.copper,
                glassTheme.glass.panelSoft,
                glassTheme.text.primary,
              )}
            >
              Launch readiness looks good.
            </div>
          ) : (
            <div className="grid gap-3">
              {settings.readiness.missing.map((item) => (
                <div
                  key={item}
                  className={cx(
                    "rounded-2xl border p-4 text-sm",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                    glassTheme.text.secondary,
                  )}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassCard
          label="Team"
          title="Active shop memberships"
          description="Users currently mapped into this shop context."
          strong
        >
          {memberships.length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary,
              )}
            >
              No active memberships found.
            </div>
          ) : (
            <div className="grid gap-3">
              {memberships.map((member, index) => (
                <div
                  key={member.id ?? `${member.user_id ?? "user"}-${index}`}
                  className={cx(
                    "grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_auto]",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                  )}
                >
                  <div className="space-y-1">
                    <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                      {member.user_id ?? "Unknown user"}
                    </div>
                    <div className={cx("text-xs", glassTheme.text.secondary)}>
                      Added {formatDateTime(member.created_at ?? null)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:justify-end">
                    <GlassBadge tone="default">
                      {formatLabel(member.role ?? "member")}
                    </GlassBadge>
                    <GlassBadge tone="copper">
                      {member.is_active === false ? "Inactive" : "Active"}
                    </GlassBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard
          label="Connected Accounts"
          title="Publishing platforms"
          description="These are the actual platform connections available to this shop."
          strong
        >
          {accounts.length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary,
              )}
            >
              No connected platform accounts yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {accounts.map((account) => {
                const expired =
                  !!account.token_expires_at &&
                  new Date(account.token_expires_at).getTime() <= Date.now();

                return (
                  <div
                    key={account.id}
                    className={cx(
                      "grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_auto]",
                      account.connection_active && !expired
                        ? glassTheme.border.copper
                        : glassTheme.border.softer,
                      glassTheme.glass.panelSoft,
                    )}
                  >
                    <div className="space-y-1">
                      <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                        {readAccountLabel(account)}
                      </div>
                      <div className={cx("text-xs", glassTheme.text.secondary)}>
                        {formatLabel(account.platform)} • Updated {formatDateTime(account.updated_at)}
                      </div>
                      <div className={cx("text-xs break-all", glassTheme.text.muted)}>
                        {account.platform_account_id ?? "No platform account id"}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <GlassBadge tone="default">
                        {formatLabel(account.platform)}
                      </GlassBadge>
                      <GlassBadge
                        tone={
                          account.connection_active && !expired ? "copper" : "muted"
                        }
                      >
                        {expired
                          ? "Expired"
                          : account.connection_active
                            ? "Connected"
                            : "Inactive"}
                      </GlassBadge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </section>
    </GlassShell>
  );
}
