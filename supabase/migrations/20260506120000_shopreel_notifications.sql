create table if not exists public.shopreel_notifications (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid null,
  user_id uuid null,
  type text not null,
  title text not null,
  body text null,
  severity text not null default 'info' check (severity in ('info', 'success', 'warning', 'error')),
  status text not null default 'unread' check (status in ('unread', 'read', 'archived')),
  entity_type text null,
  entity_id uuid null,
  action_label text null,
  action_href text null,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz null,
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shopreel_notifications_shop_created
  on public.shopreel_notifications (shop_id, created_at desc);
create index if not exists idx_shopreel_notifications_user_created
  on public.shopreel_notifications (user_id, created_at desc);
create index if not exists idx_shopreel_notifications_user_status_created
  on public.shopreel_notifications (user_id, status, created_at desc);
create index if not exists idx_shopreel_notifications_shop_status_created
  on public.shopreel_notifications (shop_id, status, created_at desc);
create index if not exists idx_shopreel_notifications_type_created
  on public.shopreel_notifications (type, created_at desc);

create trigger set_shopreel_notifications_updated_at
before update on public.shopreel_notifications
for each row
execute function public.set_updated_at();

alter table public.shopreel_notifications enable row level security;

create policy "shopreel_notifications_select_own"
on public.shopreel_notifications
for select
using (user_id = auth.uid());

create policy "shopreel_notifications_update_own"
on public.shopreel_notifications
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
