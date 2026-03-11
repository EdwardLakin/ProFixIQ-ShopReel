create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create or replace function public.current_tenant_shop_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'shop_id', '')::uuid
$$;
