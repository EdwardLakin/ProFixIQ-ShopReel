insert into storage.buckets (id, name, public)
values
  ('content-assets', 'content-assets', false),
  ('render-inputs', 'render-inputs', false),
  ('render-outputs', 'render-outputs', false),
  ('thumbnails', 'thumbnails', false),
  ('platform-previews', 'platform-previews', false)
on conflict (id) do nothing;
