-- Storage bucket for standalone ShopReel manual uploads.
-- Private bucket. Current project-safe limit: 50 MB per object.

insert into storage.buckets (id, name, public, file_size_limit)
values ('shopreel-media', 'shopreel-media', false, 52428800)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;
