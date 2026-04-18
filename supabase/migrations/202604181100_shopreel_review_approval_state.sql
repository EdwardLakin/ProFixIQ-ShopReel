alter table public.shopreel_story_generations
  add column if not exists review_approval_state text not null default 'needs_review',
  add column if not exists reviewed_by uuid null,
  add column if not exists reviewed_at timestamptz null,
  add column if not exists review_note text null;

alter table public.shopreel_story_generations
  drop constraint if exists shopreel_story_generations_review_approval_state_check;

alter table public.shopreel_story_generations
  add constraint shopreel_story_generations_review_approval_state_check
  check (review_approval_state in ('needs_review', 'approved', 'needs_changes'));

update public.shopreel_story_generations
set
  review_approval_state = 'approved',
  reviewed_at = coalesce(reviewed_at, updated_at),
  reviewed_by = coalesce(reviewed_by, created_by),
  review_note = coalesce(review_note, 'Backfilled from legacy ready status')
where review_approval_state = 'needs_review'
  and status = 'ready';

create index if not exists idx_shopreel_story_generations_shop_review_state
  on public.shopreel_story_generations(shop_id, review_approval_state, updated_at desc);
