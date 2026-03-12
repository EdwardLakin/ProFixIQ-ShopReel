export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      content_analytics_events: {
        Row: {
          content_piece_id: string | null
          created_at: string
          event_name: string
          event_value: number | null
          id: string
          occurred_at: string
          payload: Json
          platform: Database["public"]["Enums"]["content_platform"] | null
          publication_id: string | null
          source_shop_id: string
          source_system: string
          tenant_shop_id: string
        }
        Insert: {
          content_piece_id?: string | null
          created_at?: string
          event_name: string
          event_value?: number | null
          id?: string
          occurred_at?: string
          payload?: Json
          platform?: Database["public"]["Enums"]["content_platform"] | null
          publication_id?: string | null
          source_shop_id: string
          source_system?: string
          tenant_shop_id: string
        }
        Update: {
          content_piece_id?: string | null
          created_at?: string
          event_name?: string
          event_value?: number | null
          id?: string
          occurred_at?: string
          payload?: Json
          platform?: Database["public"]["Enums"]["content_platform"] | null
          publication_id?: string | null
          source_shop_id?: string
          source_system?: string
          tenant_shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_analytics_events_content_piece_id_fkey"
            columns: ["content_piece_id"]
            isOneToOne: false
            referencedRelation: "content_pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_analytics_events_content_piece_id_fkey"
            columns: ["content_piece_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_analytics_events_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "content_publications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_analytics_events_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "video_publications"
            referencedColumns: ["id"]
          },
        ]
      }
      content_assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["content_asset_type"]
          bucket: string | null
          caption: string | null
          created_at: string
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          metadata: Json
          mime_type: string | null
          public_url: string | null
          source_inspection_id: string | null
          source_inspection_photo_id: string | null
          source_media_upload_id: string | null
          source_shop_id: string
          source_system: string
          source_vehicle_id: string | null
          source_work_order_id: string | null
          storage_path: string | null
          tenant_shop_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          asset_type?: Database["public"]["Enums"]["content_asset_type"]
          bucket?: string | null
          caption?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          public_url?: string | null
          source_inspection_id?: string | null
          source_inspection_photo_id?: string | null
          source_media_upload_id?: string | null
          source_shop_id: string
          source_system?: string
          source_vehicle_id?: string | null
          source_work_order_id?: string | null
          storage_path?: string | null
          tenant_shop_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["content_asset_type"]
          bucket?: string | null
          caption?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          public_url?: string | null
          source_inspection_id?: string | null
          source_inspection_photo_id?: string | null
          source_media_upload_id?: string | null
          source_shop_id?: string
          source_system?: string
          source_vehicle_id?: string | null
          source_work_order_id?: string | null
          storage_path?: string | null
          tenant_shop_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      content_calendar_items: {
        Row: {
          calendar_id: string
          content_piece_id: string
          created_at: string
          id: string
          metadata: Json
          scheduled_for: string | null
          source_shop_id: string
          source_system: string
          status: string
          tenant_shop_id: string
          updated_at: string
        }
        Insert: {
          calendar_id: string
          content_piece_id: string
          created_at?: string
          id?: string
          metadata?: Json
          scheduled_for?: string | null
          source_shop_id: string
          source_system?: string
          status?: string
          tenant_shop_id: string
          updated_at?: string
        }
        Update: {
          calendar_id?: string
          content_piece_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          scheduled_for?: string | null
          source_shop_id?: string
          source_system?: string
          status?: string
          tenant_shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_items_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "content_calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_items_content_piece_id_fkey"
            columns: ["content_piece_id"]
            isOneToOne: false
            referencedRelation: "content_pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_items_content_piece_id_fkey"
            columns: ["content_piece_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendars: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          settings: Json
          source_shop_id: string
          source_system: string
          tenant_shop_id: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          settings?: Json
          source_shop_id: string
          source_system?: string
          tenant_shop_id: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          settings?: Json
          source_shop_id?: string
          source_system?: string
          tenant_shop_id?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      content_events: {
        Row: {
          content_piece_id: string | null
          created_at: string
          event_type: string
          id: string
          occurred_at: string
          payload: Json
          source_inspection_id: string | null
          source_inspection_photo_id: string | null
          source_media_upload_id: string | null
          source_shop_id: string
          source_system: string
          source_vehicle_id: string | null
          source_work_order_id: string | null
          tenant_shop_id: string
        }
        Insert: {
          content_piece_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          occurred_at?: string
          payload?: Json
          source_inspection_id?: string | null
          source_inspection_photo_id?: string | null
          source_media_upload_id?: string | null
          source_shop_id: string
          source_system?: string
          source_vehicle_id?: string | null
          source_work_order_id?: string | null
          tenant_shop_id: string
        }
        Update: {
          content_piece_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          occurred_at?: string
          payload?: Json
          source_inspection_id?: string | null
          source_inspection_photo_id?: string | null
          source_media_upload_id?: string | null
          source_shop_id?: string
          source_system?: string
          source_vehicle_id?: string | null
          source_work_order_id?: string | null
          tenant_shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_events_content_piece_id_fkey"
            columns: ["content_piece_id"]
            isOneToOne: false
            referencedRelation: "content_pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_events_content_piece_id_fkey"
            columns: ["content_piece_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      content_pieces: {
        Row: {
          caption: string | null
          content_type: string | null
          created_at: string
          cta: string | null
          hook: string | null
          id: string
          metadata: Json
          platform_targets: string[]
          published_at: string | null
          render_url: string | null
          script_text: string | null
          source_inspection_id: string | null
          source_inspection_photo_id: string | null
          source_media_upload_id: string | null
          source_shop_id: string
          source_system: string
          source_vehicle_id: string | null
          source_work_order_id: string | null
          status: Database["public"]["Enums"]["content_piece_status"]
          template_id: string | null
          tenant_shop_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          voiceover_text: string | null
        }
        Insert: {
          caption?: string | null
          content_type?: string | null
          created_at?: string
          cta?: string | null
          hook?: string | null
          id?: string
          metadata?: Json
          platform_targets?: string[]
          published_at?: string | null
          render_url?: string | null
          script_text?: string | null
          source_inspection_id?: string | null
          source_inspection_photo_id?: string | null
          source_media_upload_id?: string | null
          source_shop_id: string
          source_system?: string
          source_vehicle_id?: string | null
          source_work_order_id?: string | null
          status?: Database["public"]["Enums"]["content_piece_status"]
          template_id?: string | null
          tenant_shop_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          voiceover_text?: string | null
        }
        Update: {
          caption?: string | null
          content_type?: string | null
          created_at?: string
          cta?: string | null
          hook?: string | null
          id?: string
          metadata?: Json
          platform_targets?: string[]
          published_at?: string | null
          render_url?: string | null
          script_text?: string | null
          source_inspection_id?: string | null
          source_inspection_photo_id?: string | null
          source_media_upload_id?: string | null
          source_shop_id?: string
          source_system?: string
          source_vehicle_id?: string | null
          source_work_order_id?: string | null
          status?: Database["public"]["Enums"]["content_piece_status"]
          template_id?: string | null
          tenant_shop_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          voiceover_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_pieces_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "content_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      content_platform_accounts: {
        Row: {
          access_token: string | null
          connection_active: boolean
          created_at: string
          id: string
          metadata: Json
          platform: Database["public"]["Enums"]["content_platform"]
          platform_account_id: string | null
          platform_username: string | null
          refresh_token: string | null
          source_shop_id: string
          source_system: string
          tenant_shop_id: string
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          connection_active?: boolean
          created_at?: string
          id?: string
          metadata?: Json
          platform: Database["public"]["Enums"]["content_platform"]
          platform_account_id?: string | null
          platform_username?: string | null
          refresh_token?: string | null
          source_shop_id: string
          source_system?: string
          tenant_shop_id: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          connection_active?: boolean
          created_at?: string
          id?: string
          metadata?: Json
          platform?: Database["public"]["Enums"]["content_platform"]
          platform_account_id?: string | null
          platform_username?: string | null
          refresh_token?: string | null
          source_shop_id?: string
          source_system?: string
          tenant_shop_id?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      content_publications: {
        Row: {
          content_piece_id: string
          created_at: string
          error_text: string | null
          id: string
          metadata: Json
          platform: Database["public"]["Enums"]["content_platform"]
          platform_account_id: string | null
          platform_post_id: string | null
          platform_post_url: string | null
          published_at: string | null
          scheduled_for: string | null
          source_shop_id: string
          source_system: string
          status: Database["public"]["Enums"]["content_publication_status"]
          tenant_shop_id: string
          updated_at: string
        }
        Insert: {
          content_piece_id: string
          created_at?: string
          error_text?: string | null
          id?: string
          metadata?: Json
          platform: Database["public"]["Enums"]["content_platform"]
          platform_account_id?: string | null
          platform_post_id?: string | null
          platform_post_url?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          source_shop_id: string
          source_system?: string
          status?: Database["public"]["Enums"]["content_publication_status"]
          tenant_shop_id: string
          updated_at?: string
        }
        Update: {
          content_piece_id?: string
          created_at?: string
          error_text?: string | null
          id?: string
          metadata?: Json
          platform?: Database["public"]["Enums"]["content_platform"]
          platform_account_id?: string | null
          platform_post_id?: string | null
          platform_post_url?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          source_shop_id?: string
          source_system?: string
          status?: Database["public"]["Enums"]["content_publication_status"]
          tenant_shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_publications_content_piece_id_fkey"
            columns: ["content_piece_id"]
            isOneToOne: false
            referencedRelation: "content_pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_publications_content_piece_id_fkey"
            columns: ["content_piece_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_publications_platform_account_id_fkey"
            columns: ["platform_account_id"]
            isOneToOne: false
            referencedRelation: "content_platform_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_templates: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string | null
          source_shop_id: string
          source_system: string
          tenant_shop_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug?: string | null
          source_shop_id: string
          source_system?: string
          tenant_shop_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string | null
          source_shop_id?: string
          source_system?: string
          tenant_shop_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_migration_ledger: {
        Row: {
          checksum: string | null
          created_at: string
          entity_name: string
          error_text: string | null
          id: number
          migration_name: string
          source_id: string
          status: string
          target_id: string
        }
        Insert: {
          checksum?: string | null
          created_at?: string
          entity_name: string
          error_text?: string | null
          id?: number
          migration_name: string
          source_id: string
          status: string
          target_id: string
        }
        Update: {
          checksum?: string | null
          created_at?: string
          entity_name?: string
          error_text?: string | null
          id?: number
          migration_name?: string
          source_id?: string
          status?: string
          target_id?: string
        }
        Relationships: []
      }
      processed_source_events: {
        Row: {
          event_id: string
          event_type: string
          processed_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          processed_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          processed_at?: string
        }
        Relationships: []
      }
      reel_plans: {
        Row: {
          created_at: string
          hook: string | null
          id: string
          plan_json: Json
          shop_id: string
          title: string | null
          updated_at: string
          video_id: string | null
          voiceover_text: string | null
        }
        Insert: {
          created_at?: string
          hook?: string | null
          id?: string
          plan_json?: Json
          shop_id: string
          title?: string | null
          updated_at?: string
          video_id?: string | null
          voiceover_text?: string | null
        }
        Update: {
          created_at?: string
          hook?: string | null
          id?: string
          plan_json?: Json
          shop_id?: string
          title?: string | null
          updated_at?: string
          video_id?: string | null
          voiceover_text?: string | null
        }
        Relationships: []
      }
      reel_render_jobs: {
        Row: {
          attempt_count: number
          completed_at: string | null
          content_piece_id: string | null
          created_at: string
          error_message: string | null
          id: string
          locked_at: string | null
          locked_by: string | null
          publication_id: string | null
          render_payload: Json
          render_url: string | null
          run_after: string
          shop_id: string
          status: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          content_piece_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          publication_id?: string | null
          render_payload?: Json
          render_url?: string | null
          run_after?: string
          shop_id: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          content_piece_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          publication_id?: string | null
          render_payload?: Json
          render_url?: string | null
          run_after?: string
          shop_id?: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_render_jobs_content_piece_id_fkey"
            columns: ["content_piece_id"]
            isOneToOne: false
            referencedRelation: "content_pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_render_jobs_content_piece_id_fkey"
            columns: ["content_piece_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_render_jobs_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "content_publications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_render_jobs_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "video_publications"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_content_signals: {
        Row: {
          avg_engagement_score: number | null
          content_type: string
          created_at: string
          id: string
          last_posted_at: string | null
          notes: Json
          shop_id: string
          total_posts: number
          total_views: number
          updated_at: string
        }
        Insert: {
          avg_engagement_score?: number | null
          content_type: string
          created_at?: string
          id?: string
          last_posted_at?: string | null
          notes?: Json
          shop_id: string
          total_posts?: number
          total_views?: number
          updated_at?: string
        }
        Update: {
          avg_engagement_score?: number | null
          content_type?: string
          created_at?: string
          id?: string
          last_posted_at?: string | null
          notes?: Json
          shop_id?: string
          total_posts?: number
          total_views?: number
          updated_at?: string
        }
        Relationships: []
      }
      shop_marketing_memory: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          memory_key: string
          memory_value: Json
          shop_id: string
          source_id: string | null
          source_type: string | null
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          memory_key: string
          memory_value?: Json
          shop_id: string
          source_id?: string | null
          source_type?: string | null
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          memory_key?: string
          memory_value?: Json
          shop_id?: string
          source_id?: string | null
          source_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shop_reel_settings: {
        Row: {
          brand_voice: string | null
          connected_platforms: string[]
          created_at: string
          default_cta: string | null
          default_location: string | null
          enabled_platforms: string[]
          id: string
          onboarding_completed: boolean
          publish_mode: string
          shop_id: string
          updated_at: string
        }
        Insert: {
          brand_voice?: string | null
          connected_platforms?: string[]
          created_at?: string
          default_cta?: string | null
          default_location?: string | null
          enabled_platforms?: string[]
          id?: string
          onboarding_completed?: boolean
          publish_mode?: string
          shop_id: string
          updated_at?: string
        }
        Update: {
          brand_voice?: string | null
          connected_platforms?: string[]
          created_at?: string
          default_cta?: string | null
          default_location?: string | null
          enabled_platforms?: string[]
          id?: string
          onboarding_completed?: boolean
          publish_mode?: string
          shop_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopreel_manual_asset_files: {
        Row: {
          asset_id: string
          bucket: string
          created_at: string
          file_name: string | null
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          public_url: string | null
          shop_id: string
          sort_order: number
          storage_path: string
          updated_at: string
        }
        Insert: {
          asset_id: string
          bucket: string
          created_at?: string
          file_name?: string | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          public_url?: string | null
          shop_id: string
          sort_order?: number
          storage_path: string
          updated_at?: string
        }
        Update: {
          asset_id?: string
          bucket?: string
          created_at?: string
          file_name?: string | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          public_url?: string | null
          shop_id?: string
          sort_order?: number
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopreel_manual_asset_files_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "shopreel_manual_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      shopreel_manual_assets: {
        Row: {
          asset_type: string
          content_goal: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          id: string
          note: string | null
          primary_file_url: string | null
          shop_id: string
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          asset_type?: string
          content_goal?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          note?: string | null
          primary_file_url?: string | null
          shop_id: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          asset_type?: string
          content_goal?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          note?: string | null
          primary_file_url?: string | null
          shop_id?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shopreel_publish_jobs: {
        Row: {
          attempt_count: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          locked_at: string | null
          locked_by: string | null
          publication_id: string
          run_after: string
          shop_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          publication_id: string
          run_after?: string
          shop_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          publication_id?: string
          run_after?: string
          shop_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopreel_publish_jobs_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "content_publications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopreel_publish_jobs_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "video_publications"
            referencedColumns: ["id"]
          },
        ]
      }
      shopreel_story_generations: {
        Row: {
          content_piece_id: string | null
          created_at: string
          created_by: string | null
          generation_metadata: Json
          id: string
          reel_plan_id: string | null
          render_job_id: string | null
          shop_id: string
          status: string
          story_draft: Json
          story_source_id: string
          updated_at: string
        }
        Insert: {
          content_piece_id?: string | null
          created_at?: string
          created_by?: string | null
          generation_metadata?: Json
          id?: string
          reel_plan_id?: string | null
          render_job_id?: string | null
          shop_id: string
          status?: string
          story_draft?: Json
          story_source_id: string
          updated_at?: string
        }
        Update: {
          content_piece_id?: string | null
          created_at?: string
          created_by?: string | null
          generation_metadata?: Json
          id?: string
          reel_plan_id?: string | null
          render_job_id?: string | null
          shop_id?: string
          status?: string
          story_draft?: Json
          story_source_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopreel_story_generations_content_piece_id_fkey"
            columns: ["content_piece_id"]
            isOneToOne: false
            referencedRelation: "content_pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopreel_story_generations_content_piece_id_fkey"
            columns: ["content_piece_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopreel_story_generations_reel_plan_id_fkey"
            columns: ["reel_plan_id"]
            isOneToOne: false
            referencedRelation: "reel_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopreel_story_generations_render_job_id_fkey"
            columns: ["render_job_id"]
            isOneToOne: false
            referencedRelation: "reel_render_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopreel_story_generations_story_source_id_fkey"
            columns: ["story_source_id"]
            isOneToOne: false
            referencedRelation: "shopreel_story_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      shopreel_story_source_assets: {
        Row: {
          asset_type: string
          caption: string | null
          content_asset_id: string | null
          created_at: string
          id: string
          manual_asset_id: string | null
          metadata: Json
          note: string | null
          shop_id: string
          sort_order: number
          story_source_id: string
          taken_at: string | null
          title: string | null
          url: string | null
        }
        Insert: {
          asset_type: string
          caption?: string | null
          content_asset_id?: string | null
          created_at?: string
          id?: string
          manual_asset_id?: string | null
          metadata?: Json
          note?: string | null
          shop_id: string
          sort_order?: number
          story_source_id: string
          taken_at?: string | null
          title?: string | null
          url?: string | null
        }
        Update: {
          asset_type?: string
          caption?: string | null
          content_asset_id?: string | null
          created_at?: string
          id?: string
          manual_asset_id?: string | null
          metadata?: Json
          note?: string | null
          shop_id?: string
          sort_order?: number
          story_source_id?: string
          taken_at?: string | null
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopreel_story_source_assets_content_asset_id_fkey"
            columns: ["content_asset_id"]
            isOneToOne: false
            referencedRelation: "content_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopreel_story_source_assets_manual_asset_id_fkey"
            columns: ["manual_asset_id"]
            isOneToOne: false
            referencedRelation: "shopreel_manual_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopreel_story_source_assets_story_source_id_fkey"
            columns: ["story_source_id"]
            isOneToOne: false
            referencedRelation: "shopreel_story_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      shopreel_story_source_refs: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          ref_id: string
          ref_type: string
          shop_id: string
          story_source_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          ref_id: string
          ref_type: string
          shop_id: string
          story_source_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          ref_id?: string
          ref_type?: string
          shop_id?: string
          story_source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopreel_story_source_refs_story_source_id_fkey"
            columns: ["story_source_id"]
            isOneToOne: false
            referencedRelation: "shopreel_story_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      shopreel_story_sources: {
        Row: {
          created_at: string
          customer_label: string | null
          description: string | null
          ended_at: string | null
          facts: Json
          generation_mode: string
          id: string
          kind: string
          metadata: Json
          notes: string[]
          occurred_at: string | null
          origin: string
          project_id: string | null
          project_name: string | null
          shop_id: string
          source_key: string | null
          started_at: string | null
          tags: string[]
          technician_label: string | null
          title: string
          updated_at: string
          vehicle_label: string | null
        }
        Insert: {
          created_at?: string
          customer_label?: string | null
          description?: string | null
          ended_at?: string | null
          facts?: Json
          generation_mode?: string
          id?: string
          kind: string
          metadata?: Json
          notes?: string[]
          occurred_at?: string | null
          origin: string
          project_id?: string | null
          project_name?: string | null
          shop_id: string
          source_key?: string | null
          started_at?: string | null
          tags?: string[]
          technician_label?: string | null
          title: string
          updated_at?: string
          vehicle_label?: string | null
        }
        Update: {
          created_at?: string
          customer_label?: string | null
          description?: string | null
          ended_at?: string | null
          facts?: Json
          generation_mode?: string
          id?: string
          kind?: string
          metadata?: Json
          notes?: string[]
          occurred_at?: string | null
          origin?: string
          project_id?: string | null
          project_name?: string | null
          shop_id?: string
          source_key?: string | null
          started_at?: string | null
          tags?: string[]
          technician_label?: string | null
          title?: string
          updated_at?: string
          vehicle_label?: string | null
        }
        Relationships: []
      }
      source_shop_links: {
        Row: {
          created_at: string
          id: string
          source_shop_id: string
          tenant_shop_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          source_shop_id: string
          tenant_shop_id: string
        }
        Update: {
          created_at?: string
          id?: string
          source_shop_id?: string
          tenant_shop_id?: string
        }
        Relationships: []
      }
      video_metrics: {
        Row: {
          avg_watch_seconds: number
          bookings: number
          clicks: number
          comments: number
          created_at: string
          id: string
          impressions: number
          leads: number
          likes: number
          meta: Json
          metric_date: string
          platform: string
          revenue: number
          saves: number
          shares: number
          shop_id: string
          updated_at: string
          video_id: string
          video_platform_post_id: string | null
          views: number
          watch_time_seconds: number
        }
        Insert: {
          avg_watch_seconds?: number
          bookings?: number
          clicks?: number
          comments?: number
          created_at?: string
          id?: string
          impressions?: number
          leads?: number
          likes?: number
          meta?: Json
          metric_date: string
          platform: string
          revenue?: number
          saves?: number
          shares?: number
          shop_id: string
          updated_at?: string
          video_id: string
          video_platform_post_id?: string | null
          views?: number
          watch_time_seconds?: number
        }
        Update: {
          avg_watch_seconds?: number
          bookings?: number
          clicks?: number
          comments?: number
          created_at?: string
          id?: string
          impressions?: number
          leads?: number
          likes?: number
          meta?: Json
          metric_date?: string
          platform?: string
          revenue?: number
          saves?: number
          shares?: number
          shop_id?: string
          updated_at?: string
          video_id?: string
          video_platform_post_id?: string | null
          views?: number
          watch_time_seconds?: number
        }
        Relationships: []
      }
    }
    Views: {
      v_top_content_types_by_shop: {
        Row: {
          avg_engagement_score: number | null
          content_type: string | null
          last_posted_at: string | null
          shop_id: string | null
          total_posts: number | null
          total_views: number | null
        }
        Relationships: []
      }
      video_publications: {
        Row: {
          attempt_count: number | null
          caption_override: string | null
          connection_id: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          external_post_id: string | null
          external_url: string | null
          id: string | null
          platform: Database["public"]["Enums"]["content_platform"] | null
          publish_payload_json: Json | null
          published_at: string | null
          response_json: Json | null
          scheduled_for: string | null
          shop_id: string | null
          status:
            | Database["public"]["Enums"]["content_publication_status"]
            | null
          title_override: string | null
          updated_at: string | null
          video_id: string | null
        }
        Insert: {
          attempt_count?: never
          caption_override?: never
          connection_id?: string | null
          created_at?: string | null
          created_by?: never
          error_message?: string | null
          external_post_id?: string | null
          external_url?: string | null
          id?: string | null
          platform?: Database["public"]["Enums"]["content_platform"] | null
          publish_payload_json?: Json | null
          published_at?: string | null
          response_json?: never
          scheduled_for?: string | null
          shop_id?: string | null
          status?:
            | Database["public"]["Enums"]["content_publication_status"]
            | null
          title_override?: never
          updated_at?: string | null
          video_id?: string | null
        }
        Update: {
          attempt_count?: never
          caption_override?: never
          connection_id?: string | null
          created_at?: string | null
          created_by?: never
          error_message?: string | null
          external_post_id?: string | null
          external_url?: string | null
          id?: string | null
          platform?: Database["public"]["Enums"]["content_platform"] | null
          publish_payload_json?: Json | null
          published_at?: string | null
          response_json?: never
          scheduled_for?: string | null
          shop_id?: string | null
          status?:
            | Database["public"]["Enums"]["content_publication_status"]
            | null
          title_override?: never
          updated_at?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_publications_content_piece_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "content_pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_publications_content_piece_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_publications_platform_account_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "content_platform_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          ai_score: number | null
          caption: string | null
          content_type: string | null
          created_at: string | null
          created_by: string | null
          cta: string | null
          duration_seconds: number | null
          generation_notes: string | null
          hook: string | null
          human_rating: number | null
          id: string | null
          platform_targets: string[] | null
          published_at: string | null
          render_url: string | null
          script_text: string | null
          shop_id: string | null
          slug: string | null
          source_asset_id: string | null
          status: Database["public"]["Enums"]["content_piece_status"] | null
          template_id: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          voiceover_text: string | null
        }
        Insert: {
          ai_score?: never
          caption?: string | null
          content_type?: string | null
          created_at?: string | null
          created_by?: never
          cta?: string | null
          duration_seconds?: never
          generation_notes?: never
          hook?: string | null
          human_rating?: never
          id?: string | null
          platform_targets?: string[] | null
          published_at?: string | null
          render_url?: string | null
          script_text?: string | null
          shop_id?: string | null
          slug?: never
          source_asset_id?: string | null
          status?: Database["public"]["Enums"]["content_piece_status"] | null
          template_id?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          voiceover_text?: string | null
        }
        Update: {
          ai_score?: never
          caption?: string | null
          content_type?: string | null
          created_at?: string | null
          created_by?: never
          cta?: string | null
          duration_seconds?: never
          generation_notes?: never
          hook?: string | null
          human_rating?: never
          id?: string | null
          platform_targets?: string[] | null
          published_at?: string | null
          render_url?: string | null
          script_text?: string | null
          shop_id?: string | null
          slug?: never
          source_asset_id?: string | null
          status?: Database["public"]["Enums"]["content_piece_status"] | null
          template_id?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          voiceover_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_pieces_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "content_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_tenant_shop_id: { Args: never; Returns: string }
    }
    Enums: {
      content_asset_type:
        | "photo"
        | "video"
        | "thumbnail"
        | "render_input"
        | "render_output"
        | "other"
      content_piece_status:
        | "draft"
        | "queued"
        | "processing"
        | "ready"
        | "published"
        | "failed"
        | "archived"
      content_platform: "instagram" | "facebook" | "tiktok" | "youtube"
      content_publication_status:
        | "draft"
        | "queued"
        | "publishing"
        | "published"
        | "failed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      content_asset_type: [
        "photo",
        "video",
        "thumbnail",
        "render_input",
        "render_output",
        "other",
      ],
      content_piece_status: [
        "draft",
        "queued",
        "processing",
        "ready",
        "published",
        "failed",
        "archived",
      ],
      content_platform: ["instagram", "facebook", "tiktok", "youtube"],
      content_publication_status: [
        "draft",
        "queued",
        "publishing",
        "published",
        "failed",
        "cancelled",
      ],
    },
  },
} as const
