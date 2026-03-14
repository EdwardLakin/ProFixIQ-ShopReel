import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import GenerateCalendarButton from "@/features/shopreel/calendar/components/GenerateCalendarButton";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

type CalendarRow = {
  id: string;
  title: string | null;
  status: string | null;
  created_at: string | null;
};

type CalendarItemRow = {
  id: string;
  calendar_id: string;
  publish_date: string | null;
  title: string | null;
  hook: string | null;
  cta: string | null;
  status: string | null;
  content_type: string | null;
  source_work_order_id: string | null;
};

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const RECOMMENDED_WINDOWS = ["8:30 AM", "12:15 PM", "5:40 PM"] as const;

function dayLabelFromDate(value: string | null): (typeof WEEK_DAYS)[number] {
  if (!value) return "Mon";

  const date = new Date(`${value}T12:00:00`);
  const index = date.getDay();

  if (index === 0) return "Sun";
  if (index === 1) return "Mon";
  if (index === 2) return "Tue";
  if (index === 3) return "Wed";
  if (index === 4) return "Thu";
  if (index === 5) return "Fri";
  return "Sat";
}

function formatContentType(value: string | null) {
  return (value ?? "workflow_demo")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateLabel(value: string | null) {
  if (!value) return "No date";

  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default async function ShopReelCalendarPage() {
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const { data: latestCalendarData } = await legacy
    .from("content_calendars")
    .select("id, title, status, created_at")
    .or(`tenant_shop_id.eq.${shopId},source_shop_id.eq.${shopId}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const latestCalendar = (latestCalendarData ?? null) as CalendarRow | null;

  let calendarItems: CalendarItemRow[] = [];

  if (latestCalendar?.id) {
    const { data: itemsData } = await legacy
      .from("content_calendar_items")
      .select(
        "id, calendar_id, publish_date, title, hook, cta, status, content_type, source_work_order_id",
      )
      .eq("calendar_id", latestCalendar.id)
      .order("publish_date", { ascending: true });

    calendarItems = (itemsData ?? []) as CalendarItemRow[];
  }

  const groupedDays = WEEK_DAYS.map((day) => {
    const items = calendarItems.filter((item) => dayLabelFromDate(item.publish_date) === day);

    return {
      day,
      items,
      count: items.length,
    };
  });

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Calendar"
      subtitle="Publishing cadence, scheduled ideas, and recommended posting windows."
      actions={<GenerateCalendarButton />}
    >
      <ShopReelNav />

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard
          label="Publishing Week"
          title={latestCalendar?.title ?? "Content cadence"}
          description={
            latestCalendar
              ? `Latest calendar status: ${latestCalendar.status ?? "draft"}`
              : "Generate a 7-day calendar from your current ShopReel opportunities."
          }
          strong
        >
          {calendarItems.length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary,
              )}
            >
              No calendar items yet. Click Generate calendar to build a real 7-day plan.
            </div>
          ) : (
            <div className="grid gap-3">
              {groupedDays.map((day) => (
                <div
                  key={day.day}
                  className={cx(
                    "rounded-2xl border p-4",
                    day.count >= 2 ? glassTheme.border.copper : glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                  )}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                        {day.day}
                      </div>
                      <div className={cx("text-sm", glassTheme.text.secondary)}>
                        {day.count} scheduled item{day.count === 1 ? "" : "s"}
                      </div>
                    </div>
                    <GlassBadge tone={day.count >= 2 ? "copper" : "muted"}>
                      {day.count} post{day.count === 1 ? "" : "s"}
                    </GlassBadge>
                  </div>

                  {day.count === 0 ? (
                    <div className={cx("text-sm", glassTheme.text.muted)}>No items scheduled.</div>
                  ) : (
                    <div className="grid gap-3">
                      {day.items.map((item) => (
                        <div
                          key={item.id}
                          className={cx(
                            "rounded-2xl border p-4",
                            glassTheme.border.softer,
                            glassTheme.glass.panel,
                          )}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                              {item.title ?? "Untitled calendar item"}
                            </div>
                            <GlassBadge tone="default">
                              {formatContentType(item.content_type)}
                            </GlassBadge>
                          </div>

                          <div className={cx("mt-2 text-sm", glassTheme.text.secondary)}>
                            {formatDateLabel(item.publish_date)} • {item.status ?? "planned"}
                          </div>

                          {item.hook ? (
                            <div className={cx("mt-3 text-sm", glassTheme.text.primary)}>
                              {item.hook}
                            </div>
                          ) : null}

                          {item.cta ? (
                            <div className={cx("mt-2 text-sm", glassTheme.text.secondary)}>
                              CTA: {item.cta}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard
          label="Best Windows"
          title="Recommended posting times"
          description="Static timing suggestions for now. Wire these to analytics once your timing model is ready."
        >
          <div className="space-y-3">
            {RECOMMENDED_WINDOWS.map((slot) => (
              <div
                key={slot}
                className={cx(
                  "rounded-2xl border p-4",
                  glassTheme.border.copper,
                  glassTheme.glass.panelSoft,
                )}
              >
                <div className={cx("text-base font-medium", glassTheme.text.primary)}>{slot}</div>
                <div className={cx("mt-1 text-sm", glassTheme.text.secondary)}>
                  Strong recent engagement window
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>
    </GlassShell>
  );
}
