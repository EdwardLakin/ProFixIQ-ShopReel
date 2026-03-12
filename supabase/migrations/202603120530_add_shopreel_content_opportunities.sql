create table if not exists public.shopreel_content_opportunities (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  story_source_id uuid not null references public.shopreel_story_sources(id) on delete cascade,
  score numeric not null default 0,
  status text not null default 'ready',
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, story_source_id)
);

create index if not exists idx_shopreel_content_opportunities_shop_created
  on public.shopreel_content_opportunities(shop_id, created_at desc);

create index if not exists idx_shopreel_content_opportunities_shop_score
  on public.shopreel_content_opportunities(shop_id, score desc);

create or replace function public.set_shopreel_content_opportunities_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_shopreel_content_opportunities_updated_at on public.shopreel_content_opportunities;
create trigger trg_shopreel_content_opportunities_updated_at
before update on public.shopreel_content_opportunities
for each row
execute function public.set_shopreel_content_opportunities_updated_at();

alter table public.shopreel_content_opportunities enable row level security;

drop policy if exists "shopreel_content_opportunities_select" on public.shopreel_content_opportunities;
create policy "shopreel_content_opportunities_select"
on public.shopreel_content_opportunities
for select
using (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_content_opportunities_insert" on public.shopreel_content_opportunities;
create policy "shopreel_content_opportunities_insert"
on public.shopreel_content_opportunities
for insert
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_content_opportunities_update" on public.shopreel_content_opportunities;
create policy "shopreel_content_opportunities_update"
on public.shopreel_content_opportunities
for update
using (shop_id = public.current_tenant_shop_id())
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_content_opportunities_delete" on public.shopreel_content_opportunities;
create policy "shopreel_content_opportunities_delete"
on public.shopreel_content_opportunities
for delete
using (shop_id = public.current_tenant_shop_id());
