alter table public.shopreel_storyboard_scenes
add column if not exists sort_order integer;

update public.shopreel_storyboard_scenes
set sort_order = scene_order
where sort_order is null;

alter table public.shopreel_storyboard_scenes
alter column sort_order set default 0;

update public.shopreel_storyboard_scenes
set sort_order = 0
where sort_order is null;
