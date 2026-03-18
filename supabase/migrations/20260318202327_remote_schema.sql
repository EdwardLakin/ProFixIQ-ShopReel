drop extension if exists "pg_net";

drop trigger if exists "set_shopreel_creator_requests_updated_at" on "public"."shopreel_creator_requests";

drop policy "shopreel_creator_requests_delete" on "public"."shopreel_creator_requests";

drop policy "shopreel_creator_requests_insert" on "public"."shopreel_creator_requests";

drop policy "shopreel_creator_requests_select" on "public"."shopreel_creator_requests";

drop policy "shopreel_creator_requests_update" on "public"."shopreel_creator_requests";

alter table "public"."shopreel_creator_requests" drop constraint "shopreel_creator_requests_status_check";

drop index if exists "public"."idx_shopreel_creator_requests_generation_id";

drop index if exists "public"."idx_shopreel_creator_requests_shop_id";

drop index if exists "public"."idx_shopreel_creator_requests_status";

drop index if exists "public"."idx_shopreel_creator_requests_story_source_id";

drop index if exists "public"."idx_shopreel_creator_requests_mode";


  create table "public"."shopreel_automation_runs" (
    "id" uuid not null default gen_random_uuid(),
    "shop_id" uuid not null,
    "run_type" text not null default 'scheduled'::text,
    "status" text not null default 'running'::text,
    "started_at" timestamp with time zone not null default now(),
    "completed_at" timestamp with time zone,
    "queued_jobs_count" integer not null default 0,
    "processing_jobs_count" integer not null default 0,
    "synced_jobs_count" integer not null default 0,
    "active_campaigns_count" integer not null default 0,
    "learnings_count" integer not null default 0,
    "result_summary" jsonb not null default '{}'::jsonb,
    "error_text" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."shopreel_automation_runs" enable row level security;


  create table "public"."shopreel_campaign_analytics" (
    "id" uuid not null default gen_random_uuid(),
    "campaign_id" uuid not null,
    "shop_id" uuid not null,
    "total_items" integer not null default 0,
    "total_media_jobs" integer not null default 0,
    "total_completed_jobs" integer not null default 0,
    "total_content_pieces" integer not null default 0,
    "total_publications" integer not null default 0,
    "total_published" integer not null default 0,
    "total_views" numeric not null default 0,
    "total_engagement" numeric not null default 0,
    "winning_angle" text,
    "summary" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."shopreel_campaign_analytics" enable row level security;


  create table "public"."shopreel_campaign_item_scenes" (
    "id" uuid not null default gen_random_uuid(),
    "campaign_item_id" uuid not null,
    "campaign_id" uuid not null,
    "shop_id" uuid not null,
    "scene_order" integer not null,
    "title" text not null,
    "prompt" text not null,
    "duration_seconds" numeric,
    "media_job_id" uuid,
    "output_asset_id" uuid,
    "status" text not null default 'draft'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."shopreel_campaign_item_scenes" enable row level security;


  create table "public"."shopreel_campaign_items" (
    "id" uuid not null default gen_random_uuid(),
    "campaign_id" uuid not null,
    "shop_id" uuid not null,
    "sort_order" integer not null default 0,
    "angle" text not null,
    "title" text not null,
    "prompt" text not null,
    "negative_prompt" text,
    "style" text,
    "visual_mode" text,
    "aspect_ratio" text not null default '9:16'::text,
    "duration_seconds" numeric,
    "status" text not null default 'draft'::text,
    "media_job_id" uuid,
    "content_piece_id" uuid,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."shopreel_campaign_items" enable row level security;


  create table "public"."shopreel_campaign_learnings" (
    "id" uuid not null default gen_random_uuid(),
    "campaign_id" uuid not null,
    "campaign_item_id" uuid,
    "shop_id" uuid not null,
    "learning_type" text not null,
    "learning_key" text not null,
    "learning_value" jsonb not null default '{}'::jsonb,
    "confidence" numeric,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."shopreel_campaign_learnings" enable row level security;


  create table "public"."shopreel_campaigns" (
    "id" uuid not null default gen_random_uuid(),
    "shop_id" uuid not null,
    "created_by" uuid,
    "title" text not null,
    "core_idea" text not null,
    "audience" text,
    "offer" text,
    "campaign_goal" text,
    "platform_focus" text[] not null default '{}'::text[],
    "status" text not null default 'draft'::text,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."shopreel_campaigns" enable row level security;


  create table "public"."shopreel_storyboard_scenes" (
    "id" uuid not null default gen_random_uuid(),
    "storyboard_id" uuid not null,
    "shop_id" uuid not null,
    "scene_order" integer not null default 0,
    "title" text not null,
    "prompt" text,
    "overlay_text" text,
    "voiceover_text" text,
    "duration_seconds" numeric,
    "source_asset_id" uuid,
    "generated_job_id" uuid,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "sort_order" integer default 0
      );


alter table "public"."shopreel_storyboard_scenes" enable row level security;


  create table "public"."shopreel_storyboards" (
    "id" uuid not null default gen_random_uuid(),
    "shop_id" uuid not null,
    "title" text not null,
    "prompt" text,
    "enhanced_prompt" text,
    "style" text,
    "visual_mode" text,
    "aspect_ratio" text not null default '9:16'::text,
    "source_generation_job_id" uuid,
    "source_content_piece_id" uuid,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."shopreel_storyboards" enable row level security;

alter table "public"."content_platform_accounts" add column "access_token_encrypted" text;

alter table "public"."content_platform_accounts" add column "created_by" uuid;

alter table "public"."content_platform_accounts" add column "last_connected_at" timestamp with time zone;

alter table "public"."content_platform_accounts" add column "last_sync_at" timestamp with time zone;

alter table "public"."content_platform_accounts" add column "platform_user_id" text;

alter table "public"."content_platform_accounts" add column "refresh_token_encrypted" text;

alter table "public"."content_platform_accounts" add column "scopes" text[] default '{}'::text[];

alter table "public"."content_platform_accounts" add column "shop_id" uuid;

alter table "public"."shopreel_creator_requests" add column "created_by" uuid;

alter table "public"."shopreel_creator_requests" add column "error_text" text;

alter table "public"."shopreel_creator_requests" add column "source_asset_id" uuid;

alter table "public"."shopreel_creator_requests" add column "source_publication_id" uuid;

alter table "public"."shopreel_creator_requests" alter column "title" drop not null;

alter table "public"."shopreel_creator_requests" alter column "topic" drop not null;

alter table "public"."shopreel_creator_requests" disable row level security;

alter table "public"."shopreel_media_generation_jobs" add column "provider_generation_id" text;

alter table "public"."shopreel_story_sources" add column "suppressed" boolean default false;

CREATE INDEX idx_shopreel_automation_runs_shop_id ON public.shopreel_automation_runs USING btree (shop_id);

CREATE INDEX idx_shopreel_automation_runs_started_at ON public.shopreel_automation_runs USING btree (started_at DESC);

CREATE INDEX idx_shopreel_campaign_analytics_campaign_id ON public.shopreel_campaign_analytics USING btree (campaign_id);

CREATE INDEX idx_shopreel_campaign_item_scenes_campaign_id ON public.shopreel_campaign_item_scenes USING btree (campaign_id);

CREATE INDEX idx_shopreel_campaign_item_scenes_campaign_item_id ON public.shopreel_campaign_item_scenes USING btree (campaign_item_id);

CREATE INDEX idx_shopreel_campaign_item_scenes_shop_id ON public.shopreel_campaign_item_scenes USING btree (shop_id);

CREATE INDEX idx_shopreel_campaign_items_campaign_id ON public.shopreel_campaign_items USING btree (campaign_id);

CREATE INDEX idx_shopreel_campaign_items_shop_id ON public.shopreel_campaign_items USING btree (shop_id);

CREATE INDEX idx_shopreel_campaign_learnings_campaign_id ON public.shopreel_campaign_learnings USING btree (campaign_id);

CREATE INDEX idx_shopreel_campaign_learnings_shop_id ON public.shopreel_campaign_learnings USING btree (shop_id);

CREATE INDEX idx_shopreel_campaigns_shop_id ON public.shopreel_campaigns USING btree (shop_id);

CREATE INDEX idx_shopreel_creator_requests_generation ON public.shopreel_creator_requests USING btree (source_generation_id);

CREATE INDEX idx_shopreel_creator_requests_shop_created ON public.shopreel_creator_requests USING btree (shop_id, created_at DESC);

CREATE INDEX idx_shopreel_creator_requests_story_source ON public.shopreel_creator_requests USING btree (source_story_source_id);

CREATE INDEX idx_shopreel_storyboard_scenes_shop_id ON public.shopreel_storyboard_scenes USING btree (shop_id);

CREATE INDEX idx_shopreel_storyboard_scenes_storyboard_id ON public.shopreel_storyboard_scenes USING btree (storyboard_id);

CREATE INDEX idx_shopreel_storyboards_shop_id ON public.shopreel_storyboards USING btree (shop_id);

CREATE INDEX idx_story_sources_suppressed ON public.shopreel_story_sources USING btree (shop_id, suppressed);

CREATE UNIQUE INDEX shopreel_automation_runs_pkey ON public.shopreel_automation_runs USING btree (id);

CREATE UNIQUE INDEX shopreel_campaign_analytics_campaign_id_key ON public.shopreel_campaign_analytics USING btree (campaign_id);

CREATE UNIQUE INDEX shopreel_campaign_analytics_pkey ON public.shopreel_campaign_analytics USING btree (id);

CREATE UNIQUE INDEX shopreel_campaign_item_scenes_campaign_item_id_scene_order_key ON public.shopreel_campaign_item_scenes USING btree (campaign_item_id, scene_order);

CREATE UNIQUE INDEX shopreel_campaign_item_scenes_pkey ON public.shopreel_campaign_item_scenes USING btree (id);

CREATE UNIQUE INDEX shopreel_campaign_items_pkey ON public.shopreel_campaign_items USING btree (id);

CREATE UNIQUE INDEX shopreel_campaign_learnings_pkey ON public.shopreel_campaign_learnings USING btree (id);

CREATE UNIQUE INDEX shopreel_campaigns_pkey ON public.shopreel_campaigns USING btree (id);

CREATE UNIQUE INDEX shopreel_storyboard_scenes_pkey ON public.shopreel_storyboard_scenes USING btree (id);

CREATE UNIQUE INDEX shopreel_storyboards_pkey ON public.shopreel_storyboards USING btree (id);

CREATE INDEX idx_shopreel_creator_requests_mode ON public.shopreel_creator_requests USING btree (shop_id, mode, created_at DESC);

alter table "public"."shopreel_automation_runs" add constraint "shopreel_automation_runs_pkey" PRIMARY KEY using index "shopreel_automation_runs_pkey";

alter table "public"."shopreel_campaign_analytics" add constraint "shopreel_campaign_analytics_pkey" PRIMARY KEY using index "shopreel_campaign_analytics_pkey";

alter table "public"."shopreel_campaign_item_scenes" add constraint "shopreel_campaign_item_scenes_pkey" PRIMARY KEY using index "shopreel_campaign_item_scenes_pkey";

alter table "public"."shopreel_campaign_items" add constraint "shopreel_campaign_items_pkey" PRIMARY KEY using index "shopreel_campaign_items_pkey";

alter table "public"."shopreel_campaign_learnings" add constraint "shopreel_campaign_learnings_pkey" PRIMARY KEY using index "shopreel_campaign_learnings_pkey";

alter table "public"."shopreel_campaigns" add constraint "shopreel_campaigns_pkey" PRIMARY KEY using index "shopreel_campaigns_pkey";

alter table "public"."shopreel_storyboard_scenes" add constraint "shopreel_storyboard_scenes_pkey" PRIMARY KEY using index "shopreel_storyboard_scenes_pkey";

alter table "public"."shopreel_storyboards" add constraint "shopreel_storyboards_pkey" PRIMARY KEY using index "shopreel_storyboards_pkey";

alter table "public"."shopreel_campaign_analytics" add constraint "shopreel_campaign_analytics_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES public.shopreel_campaigns(id) ON DELETE CASCADE not valid;

alter table "public"."shopreel_campaign_analytics" validate constraint "shopreel_campaign_analytics_campaign_id_fkey";

alter table "public"."shopreel_campaign_analytics" add constraint "shopreel_campaign_analytics_campaign_id_key" UNIQUE using index "shopreel_campaign_analytics_campaign_id_key";

alter table "public"."shopreel_campaign_item_scenes" add constraint "shopreel_campaign_item_scenes_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES public.shopreel_campaigns(id) ON DELETE CASCADE not valid;

alter table "public"."shopreel_campaign_item_scenes" validate constraint "shopreel_campaign_item_scenes_campaign_id_fkey";

alter table "public"."shopreel_campaign_item_scenes" add constraint "shopreel_campaign_item_scenes_campaign_item_id_fkey" FOREIGN KEY (campaign_item_id) REFERENCES public.shopreel_campaign_items(id) ON DELETE CASCADE not valid;

alter table "public"."shopreel_campaign_item_scenes" validate constraint "shopreel_campaign_item_scenes_campaign_item_id_fkey";

alter table "public"."shopreel_campaign_item_scenes" add constraint "shopreel_campaign_item_scenes_campaign_item_id_scene_order_key" UNIQUE using index "shopreel_campaign_item_scenes_campaign_item_id_scene_order_key";

alter table "public"."shopreel_campaign_item_scenes" add constraint "shopreel_campaign_item_scenes_media_job_id_fkey" FOREIGN KEY (media_job_id) REFERENCES public.shopreel_media_generation_jobs(id) ON DELETE SET NULL not valid;

alter table "public"."shopreel_campaign_item_scenes" validate constraint "shopreel_campaign_item_scenes_media_job_id_fkey";

alter table "public"."shopreel_campaign_item_scenes" add constraint "shopreel_campaign_item_scenes_output_asset_id_fkey" FOREIGN KEY (output_asset_id) REFERENCES public.content_assets(id) ON DELETE SET NULL not valid;

alter table "public"."shopreel_campaign_item_scenes" validate constraint "shopreel_campaign_item_scenes_output_asset_id_fkey";

alter table "public"."shopreel_campaign_items" add constraint "shopreel_campaign_items_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES public.shopreel_campaigns(id) ON DELETE CASCADE not valid;

alter table "public"."shopreel_campaign_items" validate constraint "shopreel_campaign_items_campaign_id_fkey";

alter table "public"."shopreel_campaign_items" add constraint "shopreel_campaign_items_content_piece_id_fkey" FOREIGN KEY (content_piece_id) REFERENCES public.content_pieces(id) ON DELETE SET NULL not valid;

alter table "public"."shopreel_campaign_items" validate constraint "shopreel_campaign_items_content_piece_id_fkey";

alter table "public"."shopreel_campaign_items" add constraint "shopreel_campaign_items_media_job_id_fkey" FOREIGN KEY (media_job_id) REFERENCES public.shopreel_media_generation_jobs(id) ON DELETE SET NULL not valid;

alter table "public"."shopreel_campaign_items" validate constraint "shopreel_campaign_items_media_job_id_fkey";

alter table "public"."shopreel_campaign_learnings" add constraint "shopreel_campaign_learnings_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES public.shopreel_campaigns(id) ON DELETE CASCADE not valid;

alter table "public"."shopreel_campaign_learnings" validate constraint "shopreel_campaign_learnings_campaign_id_fkey";

alter table "public"."shopreel_campaign_learnings" add constraint "shopreel_campaign_learnings_campaign_item_id_fkey" FOREIGN KEY (campaign_item_id) REFERENCES public.shopreel_campaign_items(id) ON DELETE SET NULL not valid;

alter table "public"."shopreel_campaign_learnings" validate constraint "shopreel_campaign_learnings_campaign_item_id_fkey";

alter table "public"."shopreel_creator_requests" add constraint "shopreel_creator_requests_source_publication_id_fkey" FOREIGN KEY (source_publication_id) REFERENCES public.content_publications(id) ON DELETE SET NULL not valid;

alter table "public"."shopreel_creator_requests" validate constraint "shopreel_creator_requests_source_publication_id_fkey";

alter table "public"."shopreel_storyboard_scenes" add constraint "shopreel_storyboard_scenes_generated_job_id_fkey" FOREIGN KEY (generated_job_id) REFERENCES public.shopreel_media_generation_jobs(id) ON DELETE SET NULL not valid;

alter table "public"."shopreel_storyboard_scenes" validate constraint "shopreel_storyboard_scenes_generated_job_id_fkey";

alter table "public"."shopreel_storyboard_scenes" add constraint "shopreel_storyboard_scenes_source_asset_id_fkey" FOREIGN KEY (source_asset_id) REFERENCES public.content_assets(id) ON DELETE SET NULL not valid;

alter table "public"."shopreel_storyboard_scenes" validate constraint "shopreel_storyboard_scenes_source_asset_id_fkey";

alter table "public"."shopreel_storyboard_scenes" add constraint "shopreel_storyboard_scenes_storyboard_id_fkey" FOREIGN KEY (storyboard_id) REFERENCES public.shopreel_storyboards(id) ON DELETE CASCADE not valid;

alter table "public"."shopreel_storyboard_scenes" validate constraint "shopreel_storyboard_scenes_storyboard_id_fkey";

alter table "public"."shopreel_storyboards" add constraint "shopreel_storyboards_source_content_piece_id_fkey" FOREIGN KEY (source_content_piece_id) REFERENCES public.content_pieces(id) ON DELETE SET NULL not valid;

alter table "public"."shopreel_storyboards" validate constraint "shopreel_storyboards_source_content_piece_id_fkey";

alter table "public"."shopreel_storyboards" add constraint "shopreel_storyboards_source_generation_job_id_fkey" FOREIGN KEY (source_generation_job_id) REFERENCES public.shopreel_media_generation_jobs(id) ON DELETE SET NULL not valid;

alter table "public"."shopreel_storyboards" validate constraint "shopreel_storyboards_source_generation_job_id_fkey";

alter table "public"."shopreel_creator_requests" add constraint "shopreel_creator_requests_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'processing'::text, 'ready'::text, 'failed'::text]))) not valid;

alter table "public"."shopreel_creator_requests" validate constraint "shopreel_creator_requests_status_check";

grant delete on table "public"."shopreel_automation_runs" to "anon";

grant insert on table "public"."shopreel_automation_runs" to "anon";

grant references on table "public"."shopreel_automation_runs" to "anon";

grant select on table "public"."shopreel_automation_runs" to "anon";

grant trigger on table "public"."shopreel_automation_runs" to "anon";

grant truncate on table "public"."shopreel_automation_runs" to "anon";

grant update on table "public"."shopreel_automation_runs" to "anon";

grant delete on table "public"."shopreel_automation_runs" to "authenticated";

grant insert on table "public"."shopreel_automation_runs" to "authenticated";

grant references on table "public"."shopreel_automation_runs" to "authenticated";

grant select on table "public"."shopreel_automation_runs" to "authenticated";

grant trigger on table "public"."shopreel_automation_runs" to "authenticated";

grant truncate on table "public"."shopreel_automation_runs" to "authenticated";

grant update on table "public"."shopreel_automation_runs" to "authenticated";

grant delete on table "public"."shopreel_automation_runs" to "service_role";

grant insert on table "public"."shopreel_automation_runs" to "service_role";

grant references on table "public"."shopreel_automation_runs" to "service_role";

grant select on table "public"."shopreel_automation_runs" to "service_role";

grant trigger on table "public"."shopreel_automation_runs" to "service_role";

grant truncate on table "public"."shopreel_automation_runs" to "service_role";

grant update on table "public"."shopreel_automation_runs" to "service_role";

grant delete on table "public"."shopreel_campaign_analytics" to "anon";

grant insert on table "public"."shopreel_campaign_analytics" to "anon";

grant references on table "public"."shopreel_campaign_analytics" to "anon";

grant select on table "public"."shopreel_campaign_analytics" to "anon";

grant trigger on table "public"."shopreel_campaign_analytics" to "anon";

grant truncate on table "public"."shopreel_campaign_analytics" to "anon";

grant update on table "public"."shopreel_campaign_analytics" to "anon";

grant delete on table "public"."shopreel_campaign_analytics" to "authenticated";

grant insert on table "public"."shopreel_campaign_analytics" to "authenticated";

grant references on table "public"."shopreel_campaign_analytics" to "authenticated";

grant select on table "public"."shopreel_campaign_analytics" to "authenticated";

grant trigger on table "public"."shopreel_campaign_analytics" to "authenticated";

grant truncate on table "public"."shopreel_campaign_analytics" to "authenticated";

grant update on table "public"."shopreel_campaign_analytics" to "authenticated";

grant delete on table "public"."shopreel_campaign_analytics" to "service_role";

grant insert on table "public"."shopreel_campaign_analytics" to "service_role";

grant references on table "public"."shopreel_campaign_analytics" to "service_role";

grant select on table "public"."shopreel_campaign_analytics" to "service_role";

grant trigger on table "public"."shopreel_campaign_analytics" to "service_role";

grant truncate on table "public"."shopreel_campaign_analytics" to "service_role";

grant update on table "public"."shopreel_campaign_analytics" to "service_role";

grant delete on table "public"."shopreel_campaign_item_scenes" to "anon";

grant insert on table "public"."shopreel_campaign_item_scenes" to "anon";

grant references on table "public"."shopreel_campaign_item_scenes" to "anon";

grant select on table "public"."shopreel_campaign_item_scenes" to "anon";

grant trigger on table "public"."shopreel_campaign_item_scenes" to "anon";

grant truncate on table "public"."shopreel_campaign_item_scenes" to "anon";

grant update on table "public"."shopreel_campaign_item_scenes" to "anon";

grant delete on table "public"."shopreel_campaign_item_scenes" to "authenticated";

grant insert on table "public"."shopreel_campaign_item_scenes" to "authenticated";

grant references on table "public"."shopreel_campaign_item_scenes" to "authenticated";

grant select on table "public"."shopreel_campaign_item_scenes" to "authenticated";

grant trigger on table "public"."shopreel_campaign_item_scenes" to "authenticated";

grant truncate on table "public"."shopreel_campaign_item_scenes" to "authenticated";

grant update on table "public"."shopreel_campaign_item_scenes" to "authenticated";

grant delete on table "public"."shopreel_campaign_item_scenes" to "service_role";

grant insert on table "public"."shopreel_campaign_item_scenes" to "service_role";

grant references on table "public"."shopreel_campaign_item_scenes" to "service_role";

grant select on table "public"."shopreel_campaign_item_scenes" to "service_role";

grant trigger on table "public"."shopreel_campaign_item_scenes" to "service_role";

grant truncate on table "public"."shopreel_campaign_item_scenes" to "service_role";

grant update on table "public"."shopreel_campaign_item_scenes" to "service_role";

grant delete on table "public"."shopreel_campaign_items" to "anon";

grant insert on table "public"."shopreel_campaign_items" to "anon";

grant references on table "public"."shopreel_campaign_items" to "anon";

grant select on table "public"."shopreel_campaign_items" to "anon";

grant trigger on table "public"."shopreel_campaign_items" to "anon";

grant truncate on table "public"."shopreel_campaign_items" to "anon";

grant update on table "public"."shopreel_campaign_items" to "anon";

grant delete on table "public"."shopreel_campaign_items" to "authenticated";

grant insert on table "public"."shopreel_campaign_items" to "authenticated";

grant references on table "public"."shopreel_campaign_items" to "authenticated";

grant select on table "public"."shopreel_campaign_items" to "authenticated";

grant trigger on table "public"."shopreel_campaign_items" to "authenticated";

grant truncate on table "public"."shopreel_campaign_items" to "authenticated";

grant update on table "public"."shopreel_campaign_items" to "authenticated";

grant delete on table "public"."shopreel_campaign_items" to "service_role";

grant insert on table "public"."shopreel_campaign_items" to "service_role";

grant references on table "public"."shopreel_campaign_items" to "service_role";

grant select on table "public"."shopreel_campaign_items" to "service_role";

grant trigger on table "public"."shopreel_campaign_items" to "service_role";

grant truncate on table "public"."shopreel_campaign_items" to "service_role";

grant update on table "public"."shopreel_campaign_items" to "service_role";

grant delete on table "public"."shopreel_campaign_learnings" to "anon";

grant insert on table "public"."shopreel_campaign_learnings" to "anon";

grant references on table "public"."shopreel_campaign_learnings" to "anon";

grant select on table "public"."shopreel_campaign_learnings" to "anon";

grant trigger on table "public"."shopreel_campaign_learnings" to "anon";

grant truncate on table "public"."shopreel_campaign_learnings" to "anon";

grant update on table "public"."shopreel_campaign_learnings" to "anon";

grant delete on table "public"."shopreel_campaign_learnings" to "authenticated";

grant insert on table "public"."shopreel_campaign_learnings" to "authenticated";

grant references on table "public"."shopreel_campaign_learnings" to "authenticated";

grant select on table "public"."shopreel_campaign_learnings" to "authenticated";

grant trigger on table "public"."shopreel_campaign_learnings" to "authenticated";

grant truncate on table "public"."shopreel_campaign_learnings" to "authenticated";

grant update on table "public"."shopreel_campaign_learnings" to "authenticated";

grant delete on table "public"."shopreel_campaign_learnings" to "service_role";

grant insert on table "public"."shopreel_campaign_learnings" to "service_role";

grant references on table "public"."shopreel_campaign_learnings" to "service_role";

grant select on table "public"."shopreel_campaign_learnings" to "service_role";

grant trigger on table "public"."shopreel_campaign_learnings" to "service_role";

grant truncate on table "public"."shopreel_campaign_learnings" to "service_role";

grant update on table "public"."shopreel_campaign_learnings" to "service_role";

grant delete on table "public"."shopreel_campaigns" to "anon";

grant insert on table "public"."shopreel_campaigns" to "anon";

grant references on table "public"."shopreel_campaigns" to "anon";

grant select on table "public"."shopreel_campaigns" to "anon";

grant trigger on table "public"."shopreel_campaigns" to "anon";

grant truncate on table "public"."shopreel_campaigns" to "anon";

grant update on table "public"."shopreel_campaigns" to "anon";

grant delete on table "public"."shopreel_campaigns" to "authenticated";

grant insert on table "public"."shopreel_campaigns" to "authenticated";

grant references on table "public"."shopreel_campaigns" to "authenticated";

grant select on table "public"."shopreel_campaigns" to "authenticated";

grant trigger on table "public"."shopreel_campaigns" to "authenticated";

grant truncate on table "public"."shopreel_campaigns" to "authenticated";

grant update on table "public"."shopreel_campaigns" to "authenticated";

grant delete on table "public"."shopreel_campaigns" to "service_role";

grant insert on table "public"."shopreel_campaigns" to "service_role";

grant references on table "public"."shopreel_campaigns" to "service_role";

grant select on table "public"."shopreel_campaigns" to "service_role";

grant trigger on table "public"."shopreel_campaigns" to "service_role";

grant truncate on table "public"."shopreel_campaigns" to "service_role";

grant update on table "public"."shopreel_campaigns" to "service_role";

grant delete on table "public"."shopreel_storyboard_scenes" to "anon";

grant insert on table "public"."shopreel_storyboard_scenes" to "anon";

grant references on table "public"."shopreel_storyboard_scenes" to "anon";

grant select on table "public"."shopreel_storyboard_scenes" to "anon";

grant trigger on table "public"."shopreel_storyboard_scenes" to "anon";

grant truncate on table "public"."shopreel_storyboard_scenes" to "anon";

grant update on table "public"."shopreel_storyboard_scenes" to "anon";

grant delete on table "public"."shopreel_storyboard_scenes" to "authenticated";

grant insert on table "public"."shopreel_storyboard_scenes" to "authenticated";

grant references on table "public"."shopreel_storyboard_scenes" to "authenticated";

grant select on table "public"."shopreel_storyboard_scenes" to "authenticated";

grant trigger on table "public"."shopreel_storyboard_scenes" to "authenticated";

grant truncate on table "public"."shopreel_storyboard_scenes" to "authenticated";

grant update on table "public"."shopreel_storyboard_scenes" to "authenticated";

grant delete on table "public"."shopreel_storyboard_scenes" to "service_role";

grant insert on table "public"."shopreel_storyboard_scenes" to "service_role";

grant references on table "public"."shopreel_storyboard_scenes" to "service_role";

grant select on table "public"."shopreel_storyboard_scenes" to "service_role";

grant trigger on table "public"."shopreel_storyboard_scenes" to "service_role";

grant truncate on table "public"."shopreel_storyboard_scenes" to "service_role";

grant update on table "public"."shopreel_storyboard_scenes" to "service_role";

grant delete on table "public"."shopreel_storyboards" to "anon";

grant insert on table "public"."shopreel_storyboards" to "anon";

grant references on table "public"."shopreel_storyboards" to "anon";

grant select on table "public"."shopreel_storyboards" to "anon";

grant trigger on table "public"."shopreel_storyboards" to "anon";

grant truncate on table "public"."shopreel_storyboards" to "anon";

grant update on table "public"."shopreel_storyboards" to "anon";

grant delete on table "public"."shopreel_storyboards" to "authenticated";

grant insert on table "public"."shopreel_storyboards" to "authenticated";

grant references on table "public"."shopreel_storyboards" to "authenticated";

grant select on table "public"."shopreel_storyboards" to "authenticated";

grant trigger on table "public"."shopreel_storyboards" to "authenticated";

grant truncate on table "public"."shopreel_storyboards" to "authenticated";

grant update on table "public"."shopreel_storyboards" to "authenticated";

grant delete on table "public"."shopreel_storyboards" to "service_role";

grant insert on table "public"."shopreel_storyboards" to "service_role";

grant references on table "public"."shopreel_storyboards" to "service_role";

grant select on table "public"."shopreel_storyboards" to "service_role";

grant trigger on table "public"."shopreel_storyboards" to "service_role";

grant truncate on table "public"."shopreel_storyboards" to "service_role";

grant update on table "public"."shopreel_storyboards" to "service_role";


  create policy "shopreel_automation_runs_insert_own_shop"
  on "public"."shopreel_automation_runs"
  as permissive
  for insert
  to public
with check ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_automation_runs_select_own_shop"
  on "public"."shopreel_automation_runs"
  as permissive
  for select
  to public
using ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_automation_runs_update_own_shop"
  on "public"."shopreel_automation_runs"
  as permissive
  for update
  to public
using ((shop_id = public.current_tenant_shop_id()))
with check ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_campaign_analytics_insert_own_shop"
  on "public"."shopreel_campaign_analytics"
  as permissive
  for insert
  to public
with check ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_campaign_analytics_select_own_shop"
  on "public"."shopreel_campaign_analytics"
  as permissive
  for select
  to public
using ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_campaign_analytics_update_own_shop"
  on "public"."shopreel_campaign_analytics"
  as permissive
  for update
  to public
using ((shop_id = public.current_tenant_shop_id()))
with check ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_campaign_item_scenes_insert_own_shop"
  on "public"."shopreel_campaign_item_scenes"
  as permissive
  for insert
  to public
with check ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_campaign_item_scenes_select_own_shop"
  on "public"."shopreel_campaign_item_scenes"
  as permissive
  for select
  to public
using ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_campaign_item_scenes_update_own_shop"
  on "public"."shopreel_campaign_item_scenes"
  as permissive
  for update
  to public
using ((shop_id = public.current_tenant_shop_id()))
with check ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_campaign_items_insert_own_shop"
  on "public"."shopreel_campaign_items"
  as permissive
  for insert
  to public
with check ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_campaign_items_select_own_shop"
  on "public"."shopreel_campaign_items"
  as permissive
  for select
  to public
using ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_campaign_items_update_own_shop"
  on "public"."shopreel_campaign_items"
  as permissive
  for update
  to public
using ((shop_id = public.current_tenant_shop_id()))
with check ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_campaign_learnings_insert_own_shop"
  on "public"."shopreel_campaign_learnings"
  as permissive
  for insert
  to public
with check ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_campaign_learnings_select_own_shop"
  on "public"."shopreel_campaign_learnings"
  as permissive
  for select
  to public
using ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_campaigns_insert_own_shop"
  on "public"."shopreel_campaigns"
  as permissive
  for insert
  to public
with check ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_campaigns_select_own_shop"
  on "public"."shopreel_campaigns"
  as permissive
  for select
  to public
using ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_campaigns_update_own_shop"
  on "public"."shopreel_campaigns"
  as permissive
  for update
  to public
using ((shop_id = public.current_tenant_shop_id()))
with check ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_storyboard_scenes_insert_own_shop"
  on "public"."shopreel_storyboard_scenes"
  as permissive
  for insert
  to public
with check ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_storyboard_scenes_select_own_shop"
  on "public"."shopreel_storyboard_scenes"
  as permissive
  for select
  to public
using ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_storyboard_scenes_update_own_shop"
  on "public"."shopreel_storyboard_scenes"
  as permissive
  for update
  to public
using ((shop_id = public.current_tenant_shop_id()))
with check ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_storyboards_insert_own_shop"
  on "public"."shopreel_storyboards"
  as permissive
  for insert
  to public
with check ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_storyboards_select_own_shop"
  on "public"."shopreel_storyboards"
  as permissive
  for select
  to public
using ((shop_id = public.current_tenant_shop_id()));



  create policy "shopreel_storyboards_update_own_shop"
  on "public"."shopreel_storyboards"
  as permissive
  for update
  to public
using ((shop_id = public.current_tenant_shop_id()))
with check ((shop_id = public.current_tenant_shop_id()));



