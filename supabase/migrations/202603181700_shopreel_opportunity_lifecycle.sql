alter table public.shopreel_content_opportunities
  alter column status set default 'ready';

create index if not exists idx_shopreel_content_opportunities_shop_status_score
  on public.shopreel_content_opportunities(shop_id, status, score desc, created_at desc);
