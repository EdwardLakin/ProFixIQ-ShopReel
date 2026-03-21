


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."content_asset_type" AS ENUM (
    'photo',
    'video',
    'thumbnail',
    'render_input',
    'render_output',
    'other'
);


ALTER TYPE "public"."content_asset_type" OWNER TO "postgres";


CREATE TYPE "public"."content_piece_status" AS ENUM (
    'draft',
    'queued',
    'processing',
    'ready',
    'published',
    'failed',
    'archived'
);


ALTER TYPE "public"."content_piece_status" OWNER TO "postgres";


CREATE TYPE "public"."content_platform" AS ENUM (
    'instagram',
    'facebook',
    'tiktok',
    'youtube'
);


ALTER TYPE "public"."content_platform" OWNER TO "postgres";


CREATE TYPE "public"."content_publication_status" AS ENUM (
    'draft',
    'queued',
    'publishing',
    'published',
    'failed',
    'cancelled'
);


ALTER TYPE "public"."content_publication_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_tenant_shop_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select nullif(auth.jwt() ->> 'shop_id', '')::uuid
$$;


ALTER FUNCTION "public"."current_tenant_shop_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_shopreel_billing_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end
$$;


ALTER FUNCTION "public"."set_shopreel_billing_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_shopreel_content_opportunities_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_shopreel_content_opportunities_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_shopreel_story_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_shopreel_story_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at_compat"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end
$$;


ALTER FUNCTION "public"."set_updated_at_compat"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at_manual_assets"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end
$$;


ALTER FUNCTION "public"."set_updated_at_manual_assets"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."content_analytics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_shop_id" "uuid" NOT NULL,
    "source_shop_id" "uuid" NOT NULL,
    "source_system" "text" DEFAULT 'profixiq'::"text" NOT NULL,
    "content_piece_id" "uuid",
    "publication_id" "uuid",
    "platform" "public"."content_platform",
    "event_name" "text" NOT NULL,
    "event_value" numeric,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."content_analytics_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_shop_id" "uuid" NOT NULL,
    "source_shop_id" "uuid" NOT NULL,
    "source_vehicle_id" "uuid",
    "source_work_order_id" "uuid",
    "source_inspection_id" "uuid",
    "source_media_upload_id" "uuid",
    "source_inspection_photo_id" "uuid",
    "source_system" "text" DEFAULT 'profixiq'::"text" NOT NULL,
    "asset_type" "public"."content_asset_type" DEFAULT 'other'::"public"."content_asset_type" NOT NULL,
    "title" "text",
    "caption" "text",
    "bucket" "text",
    "storage_path" "text",
    "public_url" "text",
    "mime_type" "text",
    "duration_seconds" numeric,
    "file_size_bytes" bigint,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."content_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_calendar_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_shop_id" "uuid" NOT NULL,
    "source_shop_id" "uuid" NOT NULL,
    "source_system" "text" DEFAULT 'profixiq'::"text" NOT NULL,
    "calendar_id" "uuid" NOT NULL,
    "content_piece_id" "uuid" NOT NULL,
    "scheduled_for" timestamp with time zone,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."content_calendar_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_calendars" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_shop_id" "uuid" NOT NULL,
    "source_shop_id" "uuid" NOT NULL,
    "source_system" "text" DEFAULT 'profixiq'::"text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "timezone" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."content_calendars" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_shop_id" "uuid" NOT NULL,
    "source_shop_id" "uuid" NOT NULL,
    "source_vehicle_id" "uuid",
    "source_work_order_id" "uuid",
    "source_inspection_id" "uuid",
    "source_media_upload_id" "uuid",
    "source_inspection_photo_id" "uuid",
    "source_system" "text" DEFAULT 'profixiq'::"text" NOT NULL,
    "content_piece_id" "uuid",
    "event_type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."content_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_pieces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_shop_id" "uuid" NOT NULL,
    "source_shop_id" "uuid" NOT NULL,
    "source_vehicle_id" "uuid",
    "source_work_order_id" "uuid",
    "source_inspection_id" "uuid",
    "source_media_upload_id" "uuid",
    "source_inspection_photo_id" "uuid",
    "source_system" "text" DEFAULT 'profixiq'::"text" NOT NULL,
    "template_id" "uuid",
    "title" "text" NOT NULL,
    "hook" "text",
    "caption" "text",
    "cta" "text",
    "script_text" "text",
    "voiceover_text" "text",
    "status" "public"."content_piece_status" DEFAULT 'draft'::"public"."content_piece_status" NOT NULL,
    "content_type" "text",
    "platform_targets" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "render_url" "text",
    "thumbnail_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."content_pieces" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_platform_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_shop_id" "uuid" NOT NULL,
    "source_shop_id" "uuid" NOT NULL,
    "source_system" "text" DEFAULT 'profixiq'::"text" NOT NULL,
    "platform" "public"."content_platform" NOT NULL,
    "platform_account_id" "text",
    "platform_username" "text",
    "access_token" "text",
    "refresh_token" "text",
    "token_expires_at" timestamp with time zone,
    "connection_active" boolean DEFAULT false NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "access_token_encrypted" "text",
    "refresh_token_encrypted" "text",
    "shop_id" "uuid",
    "platform_user_id" "text",
    "created_by" "uuid",
    "last_connected_at" timestamp with time zone,
    "last_sync_at" timestamp with time zone,
    "scopes" "text"[] DEFAULT '{}'::"text"[]
);


ALTER TABLE "public"."content_platform_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_publications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_shop_id" "uuid" NOT NULL,
    "source_shop_id" "uuid" NOT NULL,
    "source_system" "text" DEFAULT 'profixiq'::"text" NOT NULL,
    "content_piece_id" "uuid" NOT NULL,
    "platform_account_id" "uuid",
    "platform" "public"."content_platform" NOT NULL,
    "status" "public"."content_publication_status" DEFAULT 'draft'::"public"."content_publication_status" NOT NULL,
    "scheduled_for" timestamp with time zone,
    "published_at" timestamp with time zone,
    "platform_post_id" "text",
    "platform_post_url" "text",
    "error_text" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."content_publications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_shop_id" "uuid" NOT NULL,
    "source_shop_id" "uuid" NOT NULL,
    "source_system" "text" DEFAULT 'profixiq'::"text" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text",
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."content_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."data_migration_ledger" (
    "id" bigint NOT NULL,
    "migration_name" "text" NOT NULL,
    "entity_name" "text" NOT NULL,
    "source_id" "uuid" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "checksum" "text",
    "error_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."data_migration_ledger" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."data_migration_ledger_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."data_migration_ledger_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."data_migration_ledger_id_seq" OWNED BY "public"."data_migration_ledger"."id";



CREATE TABLE IF NOT EXISTS "public"."global_content_benchmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "platform" "text" NOT NULL,
    "content_type" "text" NOT NULL,
    "avg_engagement_score" numeric DEFAULT 0 NOT NULL,
    "avg_views" numeric DEFAULT 0 NOT NULL,
    "avg_impressions" numeric DEFAULT 0 NOT NULL,
    "total_posts" integer DEFAULT 0 NOT NULL,
    "benchmark_window_days" integer DEFAULT 90 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."global_content_benchmarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."processed_source_events" (
    "event_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "processed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."processed_source_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reel_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "video_id" "uuid",
    "title" "text",
    "hook" "text",
    "voiceover_text" "text",
    "plan_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."reel_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reel_render_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "content_piece_id" "uuid",
    "publication_id" "uuid",
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "render_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "render_url" "text",
    "thumbnail_url" "text",
    "error_message" "text",
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "run_after" timestamp with time zone DEFAULT "now"() NOT NULL,
    "locked_at" timestamp with time zone,
    "locked_by" "text",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reel_render_jobs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."reel_render_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_content_signals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "content_type" "text" NOT NULL,
    "avg_engagement_score" numeric,
    "total_views" bigint DEFAULT 0 NOT NULL,
    "total_posts" integer DEFAULT 0 NOT NULL,
    "last_posted_at" timestamp with time zone,
    "notes" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shop_content_signals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_marketing_memory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "memory_key" "text" NOT NULL,
    "memory_value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "confidence" numeric,
    "source_id" "uuid",
    "source_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shop_marketing_memory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_reel_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "publish_mode" "text" DEFAULT 'manual'::"text" NOT NULL,
    "default_cta" "text",
    "default_location" "text",
    "brand_voice" "text",
    "enabled_platforms" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "connected_platforms" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "onboarding_completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "shop_reel_settings_publish_mode_check" CHECK (("publish_mode" = ANY (ARRAY['manual'::"text", 'approval_required'::"text", 'autopilot'::"text"])))
);


ALTER TABLE "public"."shop_reel_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_automation_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "run_type" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "status" "text" DEFAULT 'running'::"text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "queued_jobs_count" integer DEFAULT 0 NOT NULL,
    "processing_jobs_count" integer DEFAULT 0 NOT NULL,
    "synced_jobs_count" integer DEFAULT 0 NOT NULL,
    "active_campaigns_count" integer DEFAULT 0 NOT NULL,
    "learnings_count" integer DEFAULT 0 NOT NULL,
    "result_summary" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "error_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shopreel_automation_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_campaign_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "total_items" integer DEFAULT 0 NOT NULL,
    "total_media_jobs" integer DEFAULT 0 NOT NULL,
    "total_completed_jobs" integer DEFAULT 0 NOT NULL,
    "total_content_pieces" integer DEFAULT 0 NOT NULL,
    "total_publications" integer DEFAULT 0 NOT NULL,
    "total_published" integer DEFAULT 0 NOT NULL,
    "total_views" numeric DEFAULT 0 NOT NULL,
    "total_engagement" numeric DEFAULT 0 NOT NULL,
    "winning_angle" "text",
    "summary" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shopreel_campaign_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_campaign_item_scenes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_item_id" "uuid" NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "scene_order" integer NOT NULL,
    "title" "text" NOT NULL,
    "prompt" "text" NOT NULL,
    "duration_seconds" numeric,
    "media_job_id" "uuid",
    "output_asset_id" "uuid",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shopreel_campaign_item_scenes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_campaign_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "angle" "text" NOT NULL,
    "title" "text" NOT NULL,
    "prompt" "text" NOT NULL,
    "negative_prompt" "text",
    "style" "text",
    "visual_mode" "text",
    "aspect_ratio" "text" DEFAULT '9:16'::"text" NOT NULL,
    "duration_seconds" numeric,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "media_job_id" "uuid",
    "content_piece_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "final_output_asset_id" "uuid"
);


ALTER TABLE "public"."shopreel_campaign_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_campaign_learnings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "campaign_item_id" "uuid",
    "shop_id" "uuid" NOT NULL,
    "learning_type" "text" NOT NULL,
    "learning_key" "text" NOT NULL,
    "learning_value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "confidence" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shopreel_campaign_learnings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "title" "text" NOT NULL,
    "core_idea" "text" NOT NULL,
    "audience" "text",
    "offer" "text",
    "campaign_goal" "text",
    "platform_focus" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shopreel_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_content_opportunities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "story_source_id" "uuid" NOT NULL,
    "score" numeric DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'ready'::"text" NOT NULL,
    "reason" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shopreel_content_opportunities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_creator_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "mode" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "title" "text",
    "topic" "text",
    "audience" "text",
    "tone" "text",
    "platform_focus" "text",
    "source_asset_id" "uuid",
    "source_url" "text",
    "source_generation_id" "uuid",
    "source_story_source_id" "uuid",
    "source_publication_id" "uuid",
    "request_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "result_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "error_text" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "shopreel_creator_requests_mode_check" CHECK (("mode" = ANY (ARRAY['research_script'::"text", 'angle_pack'::"text", 'debunk'::"text", 'stitch'::"text"]))),
    CONSTRAINT "shopreel_creator_requests_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'processing'::"text", 'ready'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."shopreel_creator_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_manual_asset_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "asset_id" "uuid" NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "bucket" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "public_url" "text",
    "file_name" "text",
    "mime_type" "text",
    "file_size_bytes" bigint,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shopreel_manual_asset_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_manual_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "title" "text",
    "description" "text",
    "content_goal" "text",
    "note" "text",
    "asset_type" "text" DEFAULT 'mixed'::"text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "primary_file_url" "text",
    "duration_seconds" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "shopreel_manual_assets_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'uploading'::"text", 'uploaded'::"text", 'processing'::"text", 'ready'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."shopreel_manual_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_media_generation_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "source_generation_id" "uuid",
    "source_content_piece_id" "uuid",
    "provider" "text" DEFAULT 'openai'::"text" NOT NULL,
    "job_type" "text" NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "prompt" "text",
    "prompt_enhanced" "text",
    "negative_prompt" "text",
    "title" "text",
    "style" "text",
    "visual_mode" "text",
    "aspect_ratio" "text" DEFAULT '9:16'::"text" NOT NULL,
    "duration_seconds" numeric,
    "input_asset_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "output_asset_id" "uuid",
    "model" "text",
    "provider_job_id" "text",
    "preview_url" "text",
    "error_text" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "result_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "run_after" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "provider_generation_id" "text",
    CONSTRAINT "shopreel_media_generation_jobs_job_type_check" CHECK (("job_type" = ANY (ARRAY['image'::"text", 'video'::"text", 'asset_assembly'::"text"]))),
    CONSTRAINT "shopreel_media_generation_jobs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."shopreel_media_generation_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_premium_assembly_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "campaign_item_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "run_after" timestamp with time zone DEFAULT "now"() NOT NULL,
    "locked_at" timestamp with time zone,
    "locked_by" "text",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "stitched_asset_id" "uuid",
    "voiceover_asset_id" "uuid",
    "final_output_asset_id" "uuid",
    "error_text" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "result_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shopreel_premium_assembly_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_publish_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "publication_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "run_after" timestamp with time zone DEFAULT "now"() NOT NULL,
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "error_message" "text",
    "locked_at" timestamp with time zone,
    "locked_by" "text",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "shopreel_publish_jobs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."shopreel_publish_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_story_generations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "story_source_id" "uuid" NOT NULL,
    "content_piece_id" "uuid",
    "reel_plan_id" "uuid",
    "render_job_id" "uuid",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "story_draft" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "generation_metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shopreel_story_generations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_story_source_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "story_source_id" "uuid" NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "asset_type" "text" NOT NULL,
    "content_asset_id" "uuid",
    "manual_asset_id" "uuid",
    "url" "text",
    "title" "text",
    "caption" "text",
    "note" "text",
    "taken_at" timestamp with time zone,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shopreel_story_source_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_story_source_refs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "story_source_id" "uuid" NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "ref_type" "text" NOT NULL,
    "ref_id" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shopreel_story_source_refs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_story_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "kind" "text" NOT NULL,
    "origin" "text" NOT NULL,
    "generation_mode" "text" DEFAULT 'manual'::"text" NOT NULL,
    "occurred_at" timestamp with time zone,
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "project_id" "text",
    "project_name" "text",
    "vehicle_label" "text",
    "customer_label" "text",
    "technician_label" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "notes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "facts" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "source_key" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "suppressed" boolean DEFAULT false
);


ALTER TABLE "public"."shopreel_story_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_storyboard_scenes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "storyboard_id" "uuid" NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "scene_order" integer DEFAULT 0 NOT NULL,
    "title" "text" NOT NULL,
    "prompt" "text",
    "overlay_text" "text",
    "voiceover_text" "text",
    "duration_seconds" numeric,
    "source_asset_id" "uuid",
    "generated_job_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sort_order" integer DEFAULT 0
);


ALTER TABLE "public"."shopreel_storyboard_scenes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_storyboards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "prompt" "text",
    "enhanced_prompt" "text",
    "style" "text",
    "visual_mode" "text",
    "aspect_ratio" "text" DEFAULT '9:16'::"text" NOT NULL,
    "source_generation_job_id" "uuid",
    "source_content_piece_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shopreel_storyboards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "stripe_price_id" "text",
    "plan" "text" NOT NULL,
    "status" "text" DEFAULT 'inactive'::"text" NOT NULL,
    "generation_limit" integer,
    "period_start" timestamp with time zone,
    "period_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "shopreel_subscriptions_plan_check" CHECK (("plan" = ANY (ARRAY['starter'::"text", 'creator'::"text", 'pro'::"text"]))),
    CONSTRAINT "shopreel_subscriptions_status_check" CHECK (("status" = ANY (ARRAY['inactive'::"text", 'trialing'::"text", 'active'::"text", 'past_due'::"text", 'unpaid'::"text", 'canceled'::"text", 'incomplete'::"text", 'incomplete_expired'::"text"])))
);


ALTER TABLE "public"."shopreel_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopreel_usage_periods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "subscription_id" "uuid",
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone NOT NULL,
    "generations_used" integer DEFAULT 0 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shopreel_usage_periods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."source_shop_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_shop_id" "uuid" NOT NULL,
    "tenant_shop_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."source_shop_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."video_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "video_id" "uuid" NOT NULL,
    "platform" "text" NOT NULL,
    "video_platform_post_id" "text",
    "metric_date" "date" NOT NULL,
    "views" bigint DEFAULT 0 NOT NULL,
    "impressions" bigint DEFAULT 0 NOT NULL,
    "likes" bigint DEFAULT 0 NOT NULL,
    "comments" bigint DEFAULT 0 NOT NULL,
    "shares" bigint DEFAULT 0 NOT NULL,
    "saves" bigint DEFAULT 0 NOT NULL,
    "clicks" bigint DEFAULT 0 NOT NULL,
    "leads" bigint DEFAULT 0 NOT NULL,
    "bookings" bigint DEFAULT 0 NOT NULL,
    "revenue" numeric DEFAULT 0 NOT NULL,
    "watch_time_seconds" numeric DEFAULT 0 NOT NULL,
    "avg_watch_seconds" numeric DEFAULT 0 NOT NULL,
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."video_metrics" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."videos" AS
 SELECT "id",
    "tenant_shop_id" AS "shop_id",
    "template_id",
    "source_media_upload_id" AS "source_asset_id",
    "title",
    NULL::"text" AS "slug",
    "status",
    "content_type",
    "hook",
    "caption",
    "cta",
    "script_text",
    "voiceover_text",
    "platform_targets",
    "published_at",
    "thumbnail_url",
    "render_url",
    NULL::numeric AS "duration_seconds",
    NULL::numeric AS "ai_score",
    NULL::numeric AS "human_rating",
    NULL::"text" AS "generation_notes",
    NULL::"uuid" AS "created_by",
    "created_at",
    "updated_at"
   FROM "public"."content_pieces" "cp";


ALTER VIEW "public"."videos" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_top_content_types_by_shop" AS
 WITH "metric_rollup" AS (
         SELECT "vm"."shop_id",
            "vm"."video_id",
            "sum"(COALESCE("vm"."views", (0)::bigint)) AS "total_views",
            "avg"(
                CASE
                    WHEN (COALESCE("vm"."impressions", (0)::bigint) > 0) THEN ((((((COALESCE("vm"."likes", (0)::bigint) + (COALESCE("vm"."comments", (0)::bigint) * 2)) + (COALESCE("vm"."shares", (0)::bigint) * 3)) + (COALESCE("vm"."saves", (0)::bigint) * 2)) + (COALESCE("vm"."clicks", (0)::bigint) * 4)))::numeric / (GREATEST("vm"."impressions", (1)::bigint))::numeric)
                    ELSE (0)::numeric
                END) AS "avg_engagement_score"
           FROM "public"."video_metrics" "vm"
          GROUP BY "vm"."shop_id", "vm"."video_id"
        )
 SELECT "v"."shop_id",
    "v"."content_type",
    COALESCE("avg"("m"."avg_engagement_score"), (0)::numeric) AS "avg_engagement_score",
    (COALESCE("sum"("m"."total_views"), (0)::numeric))::bigint AS "total_views",
    ("count"(*))::integer AS "total_posts",
    "max"("v"."published_at") AS "last_posted_at"
   FROM ("public"."videos" "v"
     LEFT JOIN "metric_rollup" "m" ON ((("m"."video_id" = "v"."id") AND ("m"."shop_id" = "v"."shop_id"))))
  GROUP BY "v"."shop_id", "v"."content_type";


ALTER VIEW "public"."v_top_content_types_by_shop" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."video_publications" AS
 SELECT "id",
    "tenant_shop_id" AS "shop_id",
    "content_piece_id" AS "video_id",
    "platform_account_id" AS "connection_id",
    "platform",
    "status",
    "scheduled_for",
    "published_at",
    "platform_post_id" AS "external_post_id",
    "platform_post_url" AS "external_url",
    NULL::"text" AS "caption_override",
    NULL::"text" AS "title_override",
    "metadata" AS "publish_payload_json",
    '{}'::"jsonb" AS "response_json",
    0 AS "attempt_count",
    "error_text" AS "error_message",
    NULL::"uuid" AS "created_by",
    "created_at",
    "updated_at"
   FROM "public"."content_publications" "p";


ALTER VIEW "public"."video_publications" OWNER TO "postgres";


ALTER TABLE ONLY "public"."data_migration_ledger" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."data_migration_ledger_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."content_analytics_events"
    ADD CONSTRAINT "content_analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_assets"
    ADD CONSTRAINT "content_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_calendar_items"
    ADD CONSTRAINT "content_calendar_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_calendars"
    ADD CONSTRAINT "content_calendars_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_events"
    ADD CONSTRAINT "content_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_pieces"
    ADD CONSTRAINT "content_pieces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_platform_accounts"
    ADD CONSTRAINT "content_platform_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_publications"
    ADD CONSTRAINT "content_publications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_templates"
    ADD CONSTRAINT "content_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."data_migration_ledger"
    ADD CONSTRAINT "data_migration_ledger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."global_content_benchmarks"
    ADD CONSTRAINT "global_content_benchmarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."global_content_benchmarks"
    ADD CONSTRAINT "global_content_benchmarks_platform_content_type_benchmark_w_key" UNIQUE ("platform", "content_type", "benchmark_window_days");



ALTER TABLE ONLY "public"."processed_source_events"
    ADD CONSTRAINT "processed_source_events_pkey" PRIMARY KEY ("event_id");



ALTER TABLE ONLY "public"."reel_plans"
    ADD CONSTRAINT "reel_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reel_render_jobs"
    ADD CONSTRAINT "reel_render_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_content_signals"
    ADD CONSTRAINT "shop_content_signals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_content_signals"
    ADD CONSTRAINT "shop_content_signals_shop_id_content_type_key" UNIQUE ("shop_id", "content_type");



ALTER TABLE ONLY "public"."shop_marketing_memory"
    ADD CONSTRAINT "shop_marketing_memory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_marketing_memory"
    ADD CONSTRAINT "shop_marketing_memory_shop_id_memory_key_key" UNIQUE ("shop_id", "memory_key");



ALTER TABLE ONLY "public"."shop_reel_settings"
    ADD CONSTRAINT "shop_reel_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_reel_settings"
    ADD CONSTRAINT "shop_reel_settings_shop_id_key" UNIQUE ("shop_id");



ALTER TABLE ONLY "public"."shopreel_automation_runs"
    ADD CONSTRAINT "shopreel_automation_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_campaign_analytics"
    ADD CONSTRAINT "shopreel_campaign_analytics_campaign_id_key" UNIQUE ("campaign_id");



ALTER TABLE ONLY "public"."shopreel_campaign_analytics"
    ADD CONSTRAINT "shopreel_campaign_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_campaign_item_scenes"
    ADD CONSTRAINT "shopreel_campaign_item_scenes_campaign_item_id_scene_order_key" UNIQUE ("campaign_item_id", "scene_order");



ALTER TABLE ONLY "public"."shopreel_campaign_item_scenes"
    ADD CONSTRAINT "shopreel_campaign_item_scenes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_campaign_items"
    ADD CONSTRAINT "shopreel_campaign_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_campaign_learnings"
    ADD CONSTRAINT "shopreel_campaign_learnings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_campaigns"
    ADD CONSTRAINT "shopreel_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_content_opportunities"
    ADD CONSTRAINT "shopreel_content_opportunities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_content_opportunities"
    ADD CONSTRAINT "shopreel_content_opportunities_shop_id_story_source_id_key" UNIQUE ("shop_id", "story_source_id");



ALTER TABLE ONLY "public"."shopreel_creator_requests"
    ADD CONSTRAINT "shopreel_creator_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_manual_asset_files"
    ADD CONSTRAINT "shopreel_manual_asset_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_manual_assets"
    ADD CONSTRAINT "shopreel_manual_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_media_generation_jobs"
    ADD CONSTRAINT "shopreel_media_generation_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_premium_assembly_jobs"
    ADD CONSTRAINT "shopreel_premium_assembly_jobs_campaign_item_id_key" UNIQUE ("campaign_item_id");



ALTER TABLE ONLY "public"."shopreel_premium_assembly_jobs"
    ADD CONSTRAINT "shopreel_premium_assembly_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_publish_jobs"
    ADD CONSTRAINT "shopreel_publish_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_story_generations"
    ADD CONSTRAINT "shopreel_story_generations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_story_source_assets"
    ADD CONSTRAINT "shopreel_story_source_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_story_source_refs"
    ADD CONSTRAINT "shopreel_story_source_refs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_story_sources"
    ADD CONSTRAINT "shopreel_story_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_storyboard_scenes"
    ADD CONSTRAINT "shopreel_storyboard_scenes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_storyboards"
    ADD CONSTRAINT "shopreel_storyboards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_subscriptions"
    ADD CONSTRAINT "shopreel_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_subscriptions"
    ADD CONSTRAINT "shopreel_subscriptions_shop_id_key" UNIQUE ("shop_id");



ALTER TABLE ONLY "public"."shopreel_subscriptions"
    ADD CONSTRAINT "shopreel_subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."shopreel_usage_periods"
    ADD CONSTRAINT "shopreel_usage_periods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopreel_usage_periods"
    ADD CONSTRAINT "shopreel_usage_periods_shop_id_period_start_period_end_key" UNIQUE ("shop_id", "period_start", "period_end");



ALTER TABLE ONLY "public"."source_shop_links"
    ADD CONSTRAINT "source_shop_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."source_shop_links"
    ADD CONSTRAINT "source_shop_links_source_shop_id_key" UNIQUE ("source_shop_id");



ALTER TABLE ONLY "public"."source_shop_links"
    ADD CONSTRAINT "source_shop_links_tenant_shop_id_key" UNIQUE ("tenant_shop_id");



ALTER TABLE ONLY "public"."video_metrics"
    ADD CONSTRAINT "video_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."video_metrics"
    ADD CONSTRAINT "video_metrics_video_id_platform_metric_date_key" UNIQUE ("video_id", "platform", "metric_date");



CREATE INDEX "idx_content_analytics_events_publication_id" ON "public"."content_analytics_events" USING "btree" ("publication_id");



CREATE INDEX "idx_content_analytics_events_tenant_shop_id" ON "public"."content_analytics_events" USING "btree" ("tenant_shop_id");



CREATE INDEX "idx_content_assets_source_refs" ON "public"."content_assets" USING "btree" ("source_shop_id", "source_vehicle_id", "source_work_order_id", "source_inspection_id");



CREATE INDEX "idx_content_assets_tenant_shop_id" ON "public"."content_assets" USING "btree" ("tenant_shop_id");



CREATE INDEX "idx_content_calendar_items_calendar_id" ON "public"."content_calendar_items" USING "btree" ("calendar_id");



CREATE INDEX "idx_content_calendar_items_content_piece_id" ON "public"."content_calendar_items" USING "btree" ("content_piece_id");



CREATE INDEX "idx_content_calendars_tenant_shop_id" ON "public"."content_calendars" USING "btree" ("tenant_shop_id");



CREATE INDEX "idx_content_events_content_piece_id" ON "public"."content_events" USING "btree" ("content_piece_id");



CREATE INDEX "idx_content_events_tenant_shop_id" ON "public"."content_events" USING "btree" ("tenant_shop_id");



CREATE INDEX "idx_content_pieces_status" ON "public"."content_pieces" USING "btree" ("status");



CREATE INDEX "idx_content_pieces_tenant_shop_id" ON "public"."content_pieces" USING "btree" ("tenant_shop_id");



CREATE INDEX "idx_content_platform_accounts_tenant_shop_id" ON "public"."content_platform_accounts" USING "btree" ("tenant_shop_id");



CREATE UNIQUE INDEX "idx_content_platform_accounts_unique_platform_account" ON "public"."content_platform_accounts" USING "btree" ("tenant_shop_id", "platform", COALESCE("platform_account_id", ''::"text"));



CREATE INDEX "idx_content_publications_content_piece_id" ON "public"."content_publications" USING "btree" ("content_piece_id");



CREATE INDEX "idx_content_publications_status" ON "public"."content_publications" USING "btree" ("status");



CREATE INDEX "idx_content_publications_tenant_shop_id" ON "public"."content_publications" USING "btree" ("tenant_shop_id");



CREATE INDEX "idx_content_templates_tenant_shop_id" ON "public"."content_templates" USING "btree" ("tenant_shop_id");



CREATE INDEX "idx_global_content_benchmarks_platform_type" ON "public"."global_content_benchmarks" USING "btree" ("platform", "content_type");



CREATE INDEX "idx_reel_plans_shop_id" ON "public"."reel_plans" USING "btree" ("shop_id");



CREATE INDEX "idx_reel_plans_video_id" ON "public"."reel_plans" USING "btree" ("video_id");



CREATE INDEX "idx_reel_render_jobs_shop_id" ON "public"."reel_render_jobs" USING "btree" ("shop_id");



CREATE INDEX "idx_reel_render_jobs_status_run_after" ON "public"."reel_render_jobs" USING "btree" ("status", "run_after");



CREATE INDEX "idx_shop_content_signals_shop_id" ON "public"."shop_content_signals" USING "btree" ("shop_id");



CREATE INDEX "idx_shop_marketing_memory_shop_id" ON "public"."shop_marketing_memory" USING "btree" ("shop_id");



CREATE INDEX "idx_shop_reel_settings_shop_id" ON "public"."shop_reel_settings" USING "btree" ("shop_id");



CREATE INDEX "idx_shopreel_automation_runs_shop_id" ON "public"."shopreel_automation_runs" USING "btree" ("shop_id");



CREATE INDEX "idx_shopreel_automation_runs_started_at" ON "public"."shopreel_automation_runs" USING "btree" ("started_at" DESC);



CREATE INDEX "idx_shopreel_campaign_analytics_campaign_id" ON "public"."shopreel_campaign_analytics" USING "btree" ("campaign_id");



CREATE INDEX "idx_shopreel_campaign_item_scenes_campaign_id" ON "public"."shopreel_campaign_item_scenes" USING "btree" ("campaign_id");



CREATE INDEX "idx_shopreel_campaign_item_scenes_campaign_item_id" ON "public"."shopreel_campaign_item_scenes" USING "btree" ("campaign_item_id");



CREATE INDEX "idx_shopreel_campaign_item_scenes_shop_id" ON "public"."shopreel_campaign_item_scenes" USING "btree" ("shop_id");



CREATE INDEX "idx_shopreel_campaign_items_campaign_id" ON "public"."shopreel_campaign_items" USING "btree" ("campaign_id");



CREATE INDEX "idx_shopreel_campaign_items_final_output_asset_id" ON "public"."shopreel_campaign_items" USING "btree" ("final_output_asset_id");



CREATE INDEX "idx_shopreel_campaign_items_shop_id" ON "public"."shopreel_campaign_items" USING "btree" ("shop_id");



CREATE INDEX "idx_shopreel_campaign_learnings_campaign_id" ON "public"."shopreel_campaign_learnings" USING "btree" ("campaign_id");



CREATE INDEX "idx_shopreel_campaign_learnings_shop_id" ON "public"."shopreel_campaign_learnings" USING "btree" ("shop_id");



CREATE INDEX "idx_shopreel_campaigns_shop_id" ON "public"."shopreel_campaigns" USING "btree" ("shop_id");



CREATE INDEX "idx_shopreel_content_opportunities_shop_created" ON "public"."shopreel_content_opportunities" USING "btree" ("shop_id", "created_at" DESC);



CREATE INDEX "idx_shopreel_content_opportunities_shop_score" ON "public"."shopreel_content_opportunities" USING "btree" ("shop_id", "score" DESC);



CREATE INDEX "idx_shopreel_content_opportunities_shop_status_score" ON "public"."shopreel_content_opportunities" USING "btree" ("shop_id", "status", "score" DESC, "created_at" DESC);



CREATE INDEX "idx_shopreel_creator_requests_generation" ON "public"."shopreel_creator_requests" USING "btree" ("source_generation_id");



CREATE INDEX "idx_shopreel_creator_requests_mode" ON "public"."shopreel_creator_requests" USING "btree" ("shop_id", "mode", "created_at" DESC);



CREATE INDEX "idx_shopreel_creator_requests_shop_created" ON "public"."shopreel_creator_requests" USING "btree" ("shop_id", "created_at" DESC);



CREATE INDEX "idx_shopreel_creator_requests_story_source" ON "public"."shopreel_creator_requests" USING "btree" ("source_story_source_id");



CREATE INDEX "idx_shopreel_manual_asset_files_asset_id" ON "public"."shopreel_manual_asset_files" USING "btree" ("asset_id");



CREATE INDEX "idx_shopreel_manual_asset_files_shop_id" ON "public"."shopreel_manual_asset_files" USING "btree" ("shop_id");



CREATE INDEX "idx_shopreel_manual_assets_shop_id" ON "public"."shopreel_manual_assets" USING "btree" ("shop_id");



CREATE INDEX "idx_shopreel_media_generation_jobs_job_type" ON "public"."shopreel_media_generation_jobs" USING "btree" ("job_type");



CREATE INDEX "idx_shopreel_media_generation_jobs_run_after" ON "public"."shopreel_media_generation_jobs" USING "btree" ("run_after");



CREATE INDEX "idx_shopreel_media_generation_jobs_shop_id" ON "public"."shopreel_media_generation_jobs" USING "btree" ("shop_id");



CREATE INDEX "idx_shopreel_media_generation_jobs_source_generation_id" ON "public"."shopreel_media_generation_jobs" USING "btree" ("source_generation_id");



CREATE INDEX "idx_shopreel_media_generation_jobs_status" ON "public"."shopreel_media_generation_jobs" USING "btree" ("status");



CREATE INDEX "idx_shopreel_premium_assembly_jobs_campaign" ON "public"."shopreel_premium_assembly_jobs" USING "btree" ("campaign_id");



CREATE INDEX "idx_shopreel_premium_assembly_jobs_shop_status" ON "public"."shopreel_premium_assembly_jobs" USING "btree" ("shop_id", "status", "run_after");



CREATE INDEX "idx_shopreel_publish_jobs_shop_id" ON "public"."shopreel_publish_jobs" USING "btree" ("shop_id");



CREATE INDEX "idx_shopreel_publish_jobs_status_run_after" ON "public"."shopreel_publish_jobs" USING "btree" ("status", "run_after");



CREATE INDEX "idx_shopreel_story_generations_shop_created" ON "public"."shopreel_story_generations" USING "btree" ("shop_id", "created_at" DESC);



CREATE INDEX "idx_shopreel_story_generations_story_source" ON "public"."shopreel_story_generations" USING "btree" ("story_source_id", "created_at" DESC);



CREATE INDEX "idx_shopreel_story_source_assets_shop" ON "public"."shopreel_story_source_assets" USING "btree" ("shop_id", "created_at" DESC);



CREATE INDEX "idx_shopreel_story_source_assets_story_source" ON "public"."shopreel_story_source_assets" USING "btree" ("story_source_id", "sort_order");



CREATE INDEX "idx_shopreel_story_source_refs_story_source" ON "public"."shopreel_story_source_refs" USING "btree" ("story_source_id");



CREATE INDEX "idx_shopreel_story_sources_shop_created" ON "public"."shopreel_story_sources" USING "btree" ("shop_id", "created_at" DESC);



CREATE INDEX "idx_shopreel_story_sources_shop_kind" ON "public"."shopreel_story_sources" USING "btree" ("shop_id", "kind");



CREATE UNIQUE INDEX "idx_shopreel_story_sources_shop_source_key" ON "public"."shopreel_story_sources" USING "btree" ("shop_id", "source_key") WHERE ("source_key" IS NOT NULL);



CREATE INDEX "idx_shopreel_storyboard_scenes_shop_id" ON "public"."shopreel_storyboard_scenes" USING "btree" ("shop_id");



CREATE INDEX "idx_shopreel_storyboard_scenes_storyboard_id" ON "public"."shopreel_storyboard_scenes" USING "btree" ("storyboard_id");



CREATE INDEX "idx_shopreel_storyboards_shop_id" ON "public"."shopreel_storyboards" USING "btree" ("shop_id");



CREATE INDEX "idx_shopreel_subscriptions_status" ON "public"."shopreel_subscriptions" USING "btree" ("status");



CREATE INDEX "idx_shopreel_usage_periods_shop_period" ON "public"."shopreel_usage_periods" USING "btree" ("shop_id", "period_start" DESC, "period_end" DESC);



CREATE INDEX "idx_story_sources_suppressed" ON "public"."shopreel_story_sources" USING "btree" ("shop_id", "suppressed");



CREATE INDEX "idx_video_metrics_shop_id" ON "public"."video_metrics" USING "btree" ("shop_id");



CREATE INDEX "idx_video_metrics_video_id" ON "public"."video_metrics" USING "btree" ("video_id");



CREATE UNIQUE INDEX "shopreel_opportunity_source_unique" ON "public"."shopreel_content_opportunities" USING "btree" ("shop_id", "story_source_id");



CREATE OR REPLACE TRIGGER "trg_content_assets_set_updated_at" BEFORE UPDATE ON "public"."content_assets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_content_calendar_items_set_updated_at" BEFORE UPDATE ON "public"."content_calendar_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_content_calendars_set_updated_at" BEFORE UPDATE ON "public"."content_calendars" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_content_pieces_set_updated_at" BEFORE UPDATE ON "public"."content_pieces" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_content_platform_accounts_set_updated_at" BEFORE UPDATE ON "public"."content_platform_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_content_publications_set_updated_at" BEFORE UPDATE ON "public"."content_publications" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_content_templates_set_updated_at" BEFORE UPDATE ON "public"."content_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_global_content_benchmarks_updated_at" BEFORE UPDATE ON "public"."global_content_benchmarks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at_compat"();



CREATE OR REPLACE TRIGGER "trg_reel_plans_set_updated_at" BEFORE UPDATE ON "public"."reel_plans" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at_compat"();



CREATE OR REPLACE TRIGGER "trg_reel_render_jobs_set_updated_at" BEFORE UPDATE ON "public"."reel_render_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at_compat"();



CREATE OR REPLACE TRIGGER "trg_shop_content_signals_set_updated_at" BEFORE UPDATE ON "public"."shop_content_signals" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at_compat"();



CREATE OR REPLACE TRIGGER "trg_shop_marketing_memory_set_updated_at" BEFORE UPDATE ON "public"."shop_marketing_memory" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at_compat"();



CREATE OR REPLACE TRIGGER "trg_shop_reel_settings_set_updated_at" BEFORE UPDATE ON "public"."shop_reel_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at_compat"();



CREATE OR REPLACE TRIGGER "trg_shopreel_content_opportunities_updated_at" BEFORE UPDATE ON "public"."shopreel_content_opportunities" FOR EACH ROW EXECUTE FUNCTION "public"."set_shopreel_content_opportunities_updated_at"();



CREATE OR REPLACE TRIGGER "trg_shopreel_manual_asset_files_updated_at" BEFORE UPDATE ON "public"."shopreel_manual_asset_files" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at_manual_assets"();



CREATE OR REPLACE TRIGGER "trg_shopreel_manual_assets_updated_at" BEFORE UPDATE ON "public"."shopreel_manual_assets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at_manual_assets"();



CREATE OR REPLACE TRIGGER "trg_shopreel_publish_jobs_set_updated_at" BEFORE UPDATE ON "public"."shopreel_publish_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at_compat"();



CREATE OR REPLACE TRIGGER "trg_shopreel_story_generations_updated_at" BEFORE UPDATE ON "public"."shopreel_story_generations" FOR EACH ROW EXECUTE FUNCTION "public"."set_shopreel_story_updated_at"();



CREATE OR REPLACE TRIGGER "trg_shopreel_story_sources_updated_at" BEFORE UPDATE ON "public"."shopreel_story_sources" FOR EACH ROW EXECUTE FUNCTION "public"."set_shopreel_story_updated_at"();



CREATE OR REPLACE TRIGGER "trg_shopreel_subscriptions_updated_at" BEFORE UPDATE ON "public"."shopreel_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_shopreel_billing_updated_at"();



CREATE OR REPLACE TRIGGER "trg_shopreel_usage_periods_updated_at" BEFORE UPDATE ON "public"."shopreel_usage_periods" FOR EACH ROW EXECUTE FUNCTION "public"."set_shopreel_billing_updated_at"();



CREATE OR REPLACE TRIGGER "trg_video_metrics_set_updated_at" BEFORE UPDATE ON "public"."video_metrics" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at_compat"();



ALTER TABLE ONLY "public"."content_analytics_events"
    ADD CONSTRAINT "content_analytics_events_content_piece_id_fkey" FOREIGN KEY ("content_piece_id") REFERENCES "public"."content_pieces"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."content_analytics_events"
    ADD CONSTRAINT "content_analytics_events_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "public"."content_publications"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."content_calendar_items"
    ADD CONSTRAINT "content_calendar_items_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "public"."content_calendars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_calendar_items"
    ADD CONSTRAINT "content_calendar_items_content_piece_id_fkey" FOREIGN KEY ("content_piece_id") REFERENCES "public"."content_pieces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_events"
    ADD CONSTRAINT "content_events_content_piece_id_fkey" FOREIGN KEY ("content_piece_id") REFERENCES "public"."content_pieces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_pieces"
    ADD CONSTRAINT "content_pieces_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."content_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."content_publications"
    ADD CONSTRAINT "content_publications_content_piece_id_fkey" FOREIGN KEY ("content_piece_id") REFERENCES "public"."content_pieces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_publications"
    ADD CONSTRAINT "content_publications_platform_account_id_fkey" FOREIGN KEY ("platform_account_id") REFERENCES "public"."content_platform_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reel_render_jobs"
    ADD CONSTRAINT "reel_render_jobs_content_piece_id_fkey" FOREIGN KEY ("content_piece_id") REFERENCES "public"."content_pieces"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reel_render_jobs"
    ADD CONSTRAINT "reel_render_jobs_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "public"."content_publications"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_campaign_analytics"
    ADD CONSTRAINT "shopreel_campaign_analytics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."shopreel_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopreel_campaign_item_scenes"
    ADD CONSTRAINT "shopreel_campaign_item_scenes_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."shopreel_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopreel_campaign_item_scenes"
    ADD CONSTRAINT "shopreel_campaign_item_scenes_campaign_item_id_fkey" FOREIGN KEY ("campaign_item_id") REFERENCES "public"."shopreel_campaign_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopreel_campaign_item_scenes"
    ADD CONSTRAINT "shopreel_campaign_item_scenes_media_job_id_fkey" FOREIGN KEY ("media_job_id") REFERENCES "public"."shopreel_media_generation_jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_campaign_item_scenes"
    ADD CONSTRAINT "shopreel_campaign_item_scenes_output_asset_id_fkey" FOREIGN KEY ("output_asset_id") REFERENCES "public"."content_assets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_campaign_items"
    ADD CONSTRAINT "shopreel_campaign_items_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."shopreel_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopreel_campaign_items"
    ADD CONSTRAINT "shopreel_campaign_items_content_piece_id_fkey" FOREIGN KEY ("content_piece_id") REFERENCES "public"."content_pieces"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_campaign_items"
    ADD CONSTRAINT "shopreel_campaign_items_final_output_asset_id_fkey" FOREIGN KEY ("final_output_asset_id") REFERENCES "public"."content_assets"("id");



ALTER TABLE ONLY "public"."shopreel_campaign_items"
    ADD CONSTRAINT "shopreel_campaign_items_media_job_id_fkey" FOREIGN KEY ("media_job_id") REFERENCES "public"."shopreel_media_generation_jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_campaign_learnings"
    ADD CONSTRAINT "shopreel_campaign_learnings_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."shopreel_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopreel_campaign_learnings"
    ADD CONSTRAINT "shopreel_campaign_learnings_campaign_item_id_fkey" FOREIGN KEY ("campaign_item_id") REFERENCES "public"."shopreel_campaign_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_content_opportunities"
    ADD CONSTRAINT "shopreel_content_opportunities_story_source_id_fkey" FOREIGN KEY ("story_source_id") REFERENCES "public"."shopreel_story_sources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopreel_creator_requests"
    ADD CONSTRAINT "shopreel_creator_requests_source_generation_id_fkey" FOREIGN KEY ("source_generation_id") REFERENCES "public"."shopreel_story_generations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_creator_requests"
    ADD CONSTRAINT "shopreel_creator_requests_source_publication_id_fkey" FOREIGN KEY ("source_publication_id") REFERENCES "public"."content_publications"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_creator_requests"
    ADD CONSTRAINT "shopreel_creator_requests_source_story_source_id_fkey" FOREIGN KEY ("source_story_source_id") REFERENCES "public"."shopreel_story_sources"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_manual_asset_files"
    ADD CONSTRAINT "shopreel_manual_asset_files_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."shopreel_manual_assets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopreel_media_generation_jobs"
    ADD CONSTRAINT "shopreel_media_generation_jobs_output_asset_id_fkey" FOREIGN KEY ("output_asset_id") REFERENCES "public"."content_assets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_media_generation_jobs"
    ADD CONSTRAINT "shopreel_media_generation_jobs_source_content_piece_id_fkey" FOREIGN KEY ("source_content_piece_id") REFERENCES "public"."content_pieces"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_media_generation_jobs"
    ADD CONSTRAINT "shopreel_media_generation_jobs_source_generation_id_fkey" FOREIGN KEY ("source_generation_id") REFERENCES "public"."shopreel_story_generations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_premium_assembly_jobs"
    ADD CONSTRAINT "shopreel_premium_assembly_jobs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."shopreel_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopreel_premium_assembly_jobs"
    ADD CONSTRAINT "shopreel_premium_assembly_jobs_campaign_item_id_fkey" FOREIGN KEY ("campaign_item_id") REFERENCES "public"."shopreel_campaign_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopreel_premium_assembly_jobs"
    ADD CONSTRAINT "shopreel_premium_assembly_jobs_final_output_asset_id_fkey" FOREIGN KEY ("final_output_asset_id") REFERENCES "public"."content_assets"("id");



ALTER TABLE ONLY "public"."shopreel_premium_assembly_jobs"
    ADD CONSTRAINT "shopreel_premium_assembly_jobs_stitched_asset_id_fkey" FOREIGN KEY ("stitched_asset_id") REFERENCES "public"."content_assets"("id");



ALTER TABLE ONLY "public"."shopreel_premium_assembly_jobs"
    ADD CONSTRAINT "shopreel_premium_assembly_jobs_voiceover_asset_id_fkey" FOREIGN KEY ("voiceover_asset_id") REFERENCES "public"."content_assets"("id");



ALTER TABLE ONLY "public"."shopreel_publish_jobs"
    ADD CONSTRAINT "shopreel_publish_jobs_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "public"."content_publications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopreel_story_generations"
    ADD CONSTRAINT "shopreel_story_generations_content_piece_id_fkey" FOREIGN KEY ("content_piece_id") REFERENCES "public"."content_pieces"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_story_generations"
    ADD CONSTRAINT "shopreel_story_generations_reel_plan_id_fkey" FOREIGN KEY ("reel_plan_id") REFERENCES "public"."reel_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_story_generations"
    ADD CONSTRAINT "shopreel_story_generations_render_job_id_fkey" FOREIGN KEY ("render_job_id") REFERENCES "public"."reel_render_jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_story_generations"
    ADD CONSTRAINT "shopreel_story_generations_story_source_id_fkey" FOREIGN KEY ("story_source_id") REFERENCES "public"."shopreel_story_sources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopreel_story_source_assets"
    ADD CONSTRAINT "shopreel_story_source_assets_content_asset_id_fkey" FOREIGN KEY ("content_asset_id") REFERENCES "public"."content_assets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_story_source_assets"
    ADD CONSTRAINT "shopreel_story_source_assets_manual_asset_id_fkey" FOREIGN KEY ("manual_asset_id") REFERENCES "public"."shopreel_manual_assets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_story_source_assets"
    ADD CONSTRAINT "shopreel_story_source_assets_story_source_id_fkey" FOREIGN KEY ("story_source_id") REFERENCES "public"."shopreel_story_sources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopreel_story_source_refs"
    ADD CONSTRAINT "shopreel_story_source_refs_story_source_id_fkey" FOREIGN KEY ("story_source_id") REFERENCES "public"."shopreel_story_sources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopreel_storyboard_scenes"
    ADD CONSTRAINT "shopreel_storyboard_scenes_generated_job_id_fkey" FOREIGN KEY ("generated_job_id") REFERENCES "public"."shopreel_media_generation_jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_storyboard_scenes"
    ADD CONSTRAINT "shopreel_storyboard_scenes_source_asset_id_fkey" FOREIGN KEY ("source_asset_id") REFERENCES "public"."content_assets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_storyboard_scenes"
    ADD CONSTRAINT "shopreel_storyboard_scenes_storyboard_id_fkey" FOREIGN KEY ("storyboard_id") REFERENCES "public"."shopreel_storyboards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopreel_storyboards"
    ADD CONSTRAINT "shopreel_storyboards_source_content_piece_id_fkey" FOREIGN KEY ("source_content_piece_id") REFERENCES "public"."content_pieces"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_storyboards"
    ADD CONSTRAINT "shopreel_storyboards_source_generation_job_id_fkey" FOREIGN KEY ("source_generation_job_id") REFERENCES "public"."shopreel_media_generation_jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopreel_usage_periods"
    ADD CONSTRAINT "shopreel_usage_periods_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."shopreel_subscriptions"("id") ON DELETE SET NULL;



ALTER TABLE "public"."content_analytics_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_analytics_events_all" ON "public"."content_analytics_events" USING (("tenant_shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("tenant_shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."content_assets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_assets_all" ON "public"."content_assets" USING (("tenant_shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("tenant_shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."content_calendar_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_calendar_items_all" ON "public"."content_calendar_items" USING (("tenant_shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("tenant_shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."content_calendars" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_calendars_all" ON "public"."content_calendars" USING (("tenant_shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("tenant_shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."content_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_events_all" ON "public"."content_events" USING (("tenant_shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("tenant_shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."content_pieces" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_pieces_all" ON "public"."content_pieces" USING (("tenant_shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("tenant_shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."content_platform_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_platform_accounts_all" ON "public"."content_platform_accounts" USING (("tenant_shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("tenant_shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."content_publications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_publications_all" ON "public"."content_publications" USING (("tenant_shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("tenant_shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."content_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_templates_all" ON "public"."content_templates" USING (("tenant_shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("tenant_shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."reel_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reel_plans_all" ON "public"."reel_plans" USING ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text"))) WITH CHECK ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text")));



ALTER TABLE "public"."reel_render_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reel_render_jobs_all" ON "public"."reel_render_jobs" USING ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text"))) WITH CHECK ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text")));



ALTER TABLE "public"."shop_content_signals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shop_content_signals_all" ON "public"."shop_content_signals" USING ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text"))) WITH CHECK ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text")));



ALTER TABLE "public"."shop_marketing_memory" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shop_marketing_memory_all" ON "public"."shop_marketing_memory" USING ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text"))) WITH CHECK ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text")));



ALTER TABLE "public"."shop_reel_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shop_reel_settings_all" ON "public"."shop_reel_settings" USING ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text"))) WITH CHECK ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text")));



ALTER TABLE "public"."shopreel_automation_runs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_automation_runs_insert_own_shop" ON "public"."shopreel_automation_runs" FOR INSERT WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_automation_runs_select_own_shop" ON "public"."shopreel_automation_runs" FOR SELECT USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_automation_runs_update_own_shop" ON "public"."shopreel_automation_runs" FOR UPDATE USING (("shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."shopreel_campaign_analytics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_campaign_analytics_insert_own_shop" ON "public"."shopreel_campaign_analytics" FOR INSERT WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_campaign_analytics_select_own_shop" ON "public"."shopreel_campaign_analytics" FOR SELECT USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_campaign_analytics_update_own_shop" ON "public"."shopreel_campaign_analytics" FOR UPDATE USING (("shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."shopreel_campaign_item_scenes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_campaign_item_scenes_insert_own_shop" ON "public"."shopreel_campaign_item_scenes" FOR INSERT WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_campaign_item_scenes_select_own_shop" ON "public"."shopreel_campaign_item_scenes" FOR SELECT USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_campaign_item_scenes_update_own_shop" ON "public"."shopreel_campaign_item_scenes" FOR UPDATE USING (("shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."shopreel_campaign_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_campaign_items_insert_own_shop" ON "public"."shopreel_campaign_items" FOR INSERT WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_campaign_items_select_own_shop" ON "public"."shopreel_campaign_items" FOR SELECT USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_campaign_items_update_own_shop" ON "public"."shopreel_campaign_items" FOR UPDATE USING (("shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."shopreel_campaign_learnings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_campaign_learnings_insert_own_shop" ON "public"."shopreel_campaign_learnings" FOR INSERT WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_campaign_learnings_select_own_shop" ON "public"."shopreel_campaign_learnings" FOR SELECT USING (("shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."shopreel_campaigns" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_campaigns_insert_own_shop" ON "public"."shopreel_campaigns" FOR INSERT WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_campaigns_select_own_shop" ON "public"."shopreel_campaigns" FOR SELECT USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_campaigns_update_own_shop" ON "public"."shopreel_campaigns" FOR UPDATE USING (("shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."shopreel_content_opportunities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_content_opportunities_delete" ON "public"."shopreel_content_opportunities" FOR DELETE USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_content_opportunities_insert" ON "public"."shopreel_content_opportunities" FOR INSERT WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_content_opportunities_select" ON "public"."shopreel_content_opportunities" FOR SELECT USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_content_opportunities_update" ON "public"."shopreel_content_opportunities" FOR UPDATE USING (("shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."shopreel_manual_asset_files" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_manual_asset_files_all" ON "public"."shopreel_manual_asset_files" USING ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text"))) WITH CHECK ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text")));



ALTER TABLE "public"."shopreel_manual_assets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_manual_assets_all" ON "public"."shopreel_manual_assets" USING ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text"))) WITH CHECK ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text")));



ALTER TABLE "public"."shopreel_media_generation_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_media_generation_jobs_insert_own_shop" ON "public"."shopreel_media_generation_jobs" FOR INSERT WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_media_generation_jobs_select_own_shop" ON "public"."shopreel_media_generation_jobs" FOR SELECT USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_media_generation_jobs_update_own_shop" ON "public"."shopreel_media_generation_jobs" FOR UPDATE USING (("shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."shopreel_premium_assembly_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_premium_assembly_jobs_insert" ON "public"."shopreel_premium_assembly_jobs" FOR INSERT WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_premium_assembly_jobs_select" ON "public"."shopreel_premium_assembly_jobs" FOR SELECT USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_premium_assembly_jobs_update" ON "public"."shopreel_premium_assembly_jobs" FOR UPDATE USING (("shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."shopreel_publish_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_publish_jobs_all" ON "public"."shopreel_publish_jobs" USING ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text"))) WITH CHECK ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text")));



ALTER TABLE "public"."shopreel_story_generations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_story_generations_delete" ON "public"."shopreel_story_generations" FOR DELETE USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_story_generations_insert" ON "public"."shopreel_story_generations" FOR INSERT WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_story_generations_select" ON "public"."shopreel_story_generations" FOR SELECT USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_story_generations_update" ON "public"."shopreel_story_generations" FOR UPDATE USING (("shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."shopreel_story_source_assets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_story_source_assets_delete" ON "public"."shopreel_story_source_assets" FOR DELETE USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_story_source_assets_insert" ON "public"."shopreel_story_source_assets" FOR INSERT WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_story_source_assets_select" ON "public"."shopreel_story_source_assets" FOR SELECT USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_story_source_assets_update" ON "public"."shopreel_story_source_assets" FOR UPDATE USING (("shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."shopreel_story_source_refs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_story_source_refs_delete" ON "public"."shopreel_story_source_refs" FOR DELETE USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_story_source_refs_insert" ON "public"."shopreel_story_source_refs" FOR INSERT WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_story_source_refs_select" ON "public"."shopreel_story_source_refs" FOR SELECT USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_story_source_refs_update" ON "public"."shopreel_story_source_refs" FOR UPDATE USING (("shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."shopreel_story_sources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_story_sources_delete" ON "public"."shopreel_story_sources" FOR DELETE USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_story_sources_insert" ON "public"."shopreel_story_sources" FOR INSERT WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_story_sources_select" ON "public"."shopreel_story_sources" FOR SELECT USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_story_sources_update" ON "public"."shopreel_story_sources" FOR UPDATE USING (("shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."shopreel_storyboard_scenes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_storyboard_scenes_insert_own_shop" ON "public"."shopreel_storyboard_scenes" FOR INSERT WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_storyboard_scenes_select_own_shop" ON "public"."shopreel_storyboard_scenes" FOR SELECT USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_storyboard_scenes_update_own_shop" ON "public"."shopreel_storyboard_scenes" FOR UPDATE USING (("shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."shopreel_storyboards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_storyboards_insert_own_shop" ON "public"."shopreel_storyboards" FOR INSERT WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_storyboards_select_own_shop" ON "public"."shopreel_storyboards" FOR SELECT USING (("shop_id" = "public"."current_tenant_shop_id"()));



CREATE POLICY "shopreel_storyboards_update_own_shop" ON "public"."shopreel_storyboards" FOR UPDATE USING (("shop_id" = "public"."current_tenant_shop_id"())) WITH CHECK (("shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."shopreel_subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_subscriptions_all" ON "public"."shopreel_subscriptions" USING ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text"))) WITH CHECK ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text")));



ALTER TABLE "public"."shopreel_usage_periods" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopreel_usage_periods_all" ON "public"."shopreel_usage_periods" USING ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text"))) WITH CHECK ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text")));



ALTER TABLE "public"."source_shop_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "source_shop_links_select" ON "public"."source_shop_links" FOR SELECT USING (("tenant_shop_id" = "public"."current_tenant_shop_id"()));



ALTER TABLE "public"."video_metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "video_metrics_all" ON "public"."video_metrics" USING ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text"))) WITH CHECK ((("shop_id")::"text" = ("auth"."jwt"() ->> 'shop_id'::"text")));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."current_tenant_shop_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_tenant_shop_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_tenant_shop_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_shopreel_billing_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_shopreel_billing_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_shopreel_billing_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_shopreel_content_opportunities_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_shopreel_content_opportunities_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_shopreel_content_opportunities_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_shopreel_story_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_shopreel_story_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_shopreel_story_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at_compat"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at_compat"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at_compat"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at_manual_assets"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at_manual_assets"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at_manual_assets"() TO "service_role";



GRANT ALL ON TABLE "public"."content_analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."content_analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."content_analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."content_assets" TO "anon";
GRANT ALL ON TABLE "public"."content_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."content_assets" TO "service_role";



GRANT ALL ON TABLE "public"."content_calendar_items" TO "anon";
GRANT ALL ON TABLE "public"."content_calendar_items" TO "authenticated";
GRANT ALL ON TABLE "public"."content_calendar_items" TO "service_role";



GRANT ALL ON TABLE "public"."content_calendars" TO "anon";
GRANT ALL ON TABLE "public"."content_calendars" TO "authenticated";
GRANT ALL ON TABLE "public"."content_calendars" TO "service_role";



GRANT ALL ON TABLE "public"."content_events" TO "anon";
GRANT ALL ON TABLE "public"."content_events" TO "authenticated";
GRANT ALL ON TABLE "public"."content_events" TO "service_role";



GRANT ALL ON TABLE "public"."content_pieces" TO "anon";
GRANT ALL ON TABLE "public"."content_pieces" TO "authenticated";
GRANT ALL ON TABLE "public"."content_pieces" TO "service_role";



GRANT ALL ON TABLE "public"."content_platform_accounts" TO "anon";
GRANT ALL ON TABLE "public"."content_platform_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."content_platform_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."content_publications" TO "anon";
GRANT ALL ON TABLE "public"."content_publications" TO "authenticated";
GRANT ALL ON TABLE "public"."content_publications" TO "service_role";



GRANT ALL ON TABLE "public"."content_templates" TO "anon";
GRANT ALL ON TABLE "public"."content_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."content_templates" TO "service_role";



GRANT ALL ON TABLE "public"."data_migration_ledger" TO "anon";
GRANT ALL ON TABLE "public"."data_migration_ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."data_migration_ledger" TO "service_role";



GRANT ALL ON SEQUENCE "public"."data_migration_ledger_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."data_migration_ledger_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."data_migration_ledger_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."global_content_benchmarks" TO "anon";
GRANT ALL ON TABLE "public"."global_content_benchmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."global_content_benchmarks" TO "service_role";



GRANT ALL ON TABLE "public"."processed_source_events" TO "anon";
GRANT ALL ON TABLE "public"."processed_source_events" TO "authenticated";
GRANT ALL ON TABLE "public"."processed_source_events" TO "service_role";



GRANT ALL ON TABLE "public"."reel_plans" TO "anon";
GRANT ALL ON TABLE "public"."reel_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."reel_plans" TO "service_role";



GRANT ALL ON TABLE "public"."reel_render_jobs" TO "anon";
GRANT ALL ON TABLE "public"."reel_render_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."reel_render_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."shop_content_signals" TO "anon";
GRANT ALL ON TABLE "public"."shop_content_signals" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_content_signals" TO "service_role";



GRANT ALL ON TABLE "public"."shop_marketing_memory" TO "anon";
GRANT ALL ON TABLE "public"."shop_marketing_memory" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_marketing_memory" TO "service_role";



GRANT ALL ON TABLE "public"."shop_reel_settings" TO "anon";
GRANT ALL ON TABLE "public"."shop_reel_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_reel_settings" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_automation_runs" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_automation_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_automation_runs" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_campaign_analytics" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_campaign_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_campaign_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_campaign_item_scenes" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_campaign_item_scenes" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_campaign_item_scenes" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_campaign_items" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_campaign_items" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_campaign_items" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_campaign_learnings" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_campaign_learnings" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_campaign_learnings" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_content_opportunities" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_content_opportunities" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_content_opportunities" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_creator_requests" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_creator_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_creator_requests" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_manual_asset_files" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_manual_asset_files" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_manual_asset_files" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_manual_assets" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_manual_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_manual_assets" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_media_generation_jobs" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_media_generation_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_media_generation_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_premium_assembly_jobs" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_premium_assembly_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_premium_assembly_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_publish_jobs" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_publish_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_publish_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_story_generations" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_story_generations" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_story_generations" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_story_source_assets" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_story_source_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_story_source_assets" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_story_source_refs" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_story_source_refs" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_story_source_refs" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_story_sources" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_story_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_story_sources" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_storyboard_scenes" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_storyboard_scenes" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_storyboard_scenes" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_storyboards" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_storyboards" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_storyboards" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."shopreel_usage_periods" TO "anon";
GRANT ALL ON TABLE "public"."shopreel_usage_periods" TO "authenticated";
GRANT ALL ON TABLE "public"."shopreel_usage_periods" TO "service_role";



GRANT ALL ON TABLE "public"."source_shop_links" TO "anon";
GRANT ALL ON TABLE "public"."source_shop_links" TO "authenticated";
GRANT ALL ON TABLE "public"."source_shop_links" TO "service_role";



GRANT ALL ON TABLE "public"."video_metrics" TO "anon";
GRANT ALL ON TABLE "public"."video_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."video_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."videos" TO "anon";
GRANT ALL ON TABLE "public"."videos" TO "authenticated";
GRANT ALL ON TABLE "public"."videos" TO "service_role";



GRANT ALL ON TABLE "public"."v_top_content_types_by_shop" TO "anon";
GRANT ALL ON TABLE "public"."v_top_content_types_by_shop" TO "authenticated";
GRANT ALL ON TABLE "public"."v_top_content_types_by_shop" TO "service_role";



GRANT ALL ON TABLE "public"."video_publications" TO "anon";
GRANT ALL ON TABLE "public"."video_publications" TO "authenticated";
GRANT ALL ON TABLE "public"."video_publications" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







