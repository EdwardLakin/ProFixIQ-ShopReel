do $$
begin
  if not exists (select 1 from pg_type where typname = 'content_piece_status') then
    create type public.content_piece_status as enum (
      'draft',
      'queued',
      'processing',
      'ready',
      'published',
      'failed',
      'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'content_publication_status') then
    create type public.content_publication_status as enum (
      'draft',
      'queued',
      'publishing',
      'published',
      'failed',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'content_platform') then
    create type public.content_platform as enum (
      'instagram',
      'facebook',
      'tiktok',
      'youtube'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'content_asset_type') then
    create type public.content_asset_type as enum (
      'photo',
      'video',
      'thumbnail',
      'render_input',
      'render_output',
      'other'
    );
  end if;
end
$$;
