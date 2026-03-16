create extension if not exists pgcrypto;

create table if not exists public.shopreel_subscriptions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null unique,
  stripe_customer_id text null,
  stripe_subscription_id text null unique,
  stripe_price_id text null,
  plan text not null
    check (plan in ('starter', 'creator', 'pro')),
  status text not null default 'inactive'
    check (
      status in (
        'inactive',
        'trialing',
        'active',
        'past_due',
        'unpaid',
        'canceled',
        'incomplete',
        'incomplete_expired'
      )
    ),
  generation_limit integer null,
  period_start timestamptz null,
  period_end timestamptz null,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shopreel_subscriptions_status
  on public.shopreel_subscriptions(status);

create table if not exists public.shopreel_usage_periods (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  subscription_id uuid null references public.shopreel_subscriptions(id) on delete set null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  generations_used integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, period_start, period_end)
);

create index if not exists idx_shopreel_usage_periods_shop_period
  on public.shopreel_usage_periods(shop_id, period_start desc, period_end desc);

create or replace function public.set_shopreel_billing_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists trg_shopreel_subscriptions_updated_at on public.shopreel_subscriptions;
create trigger trg_shopreel_subscriptions_updated_at
before update on public.shopreel_subscriptions
for each row
execute function public.set_shopreel_billing_updated_at();

drop trigger if exists trg_shopreel_usage_periods_updated_at on public.shopreel_usage_periods;
create trigger trg_shopreel_usage_periods_updated_at
before update on public.shopreel_usage_periods
for each row
execute function public.set_shopreel_billing_updated_at();

alter table public.shopreel_subscriptions enable row level security;
alter table public.shopreel_usage_periods enable row level security;

drop policy if exists shopreel_subscriptions_all on public.shopreel_subscriptions;
create policy shopreel_subscriptions_all
on public.shopreel_subscriptions
for all
using (shop_id::text = auth.jwt() ->> 'shop_id')
with check (shop_id::text = auth.jwt() ->> 'shop_id');

drop policy if exists shopreel_usage_periods_all on public.shopreel_usage_periods;
create policy shopreel_usage_periods_all
on public.shopreel_usage_periods
for all
using (shop_id::text = auth.jwt() ->> 'shop_id')
with check (shop_id::text = auth.jwt() ->> 'shop_id');
