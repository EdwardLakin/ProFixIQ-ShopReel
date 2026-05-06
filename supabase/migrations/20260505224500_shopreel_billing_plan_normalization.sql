-- Normalize ShopReel billing plans to runtime plan keys.
-- Runtime uses starter/growth/unlimited.

alter table public.shopreel_subscriptions
  drop constraint if exists shopreel_subscriptions_plan_check;

update public.shopreel_subscriptions
set plan = case
  when plan = 'creator' then 'growth'
  when plan = 'pro' then 'unlimited'
  else plan
end
where plan in ('creator', 'pro');

alter table public.shopreel_subscriptions
  add constraint shopreel_subscriptions_plan_check
  check (plan in ('starter', 'growth', 'unlimited'));

alter table public.shopreel_subscriptions
  add column if not exists trial_end timestamptz null;
