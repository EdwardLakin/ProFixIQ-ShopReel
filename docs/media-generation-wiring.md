# Campaign media generation wiring

Main campaign flow is **approved package → choose image purpose → generate/select image → generate video**. Text-to-video may exist in provider APIs, but it is not the canonical campaign-item flow in this phase.

## Image purpose choices
- `static_ad`: generated vertical social ad image for Facebook/Instagram/boosted/flyer-style posting (recommended default for business advertising).
- `video_reference`: generated first/reference frame intended for image-to-video.
- `uploaded_reference`: user-provided reference image (currently shown with upload path guidance; item-level connection is coming next where not yet wired).

## Static ad vs video reference
- Static ad prompts bias toward clean ad-ready composition, local-business realism, and caption/CTA overlay space.
- Video reference prompts bias toward cinematic first-frame composition with motion potential for image-to-video.

## Providers found in code
- `openai` (`src/features/shopreel/video-creation/providers/openai.ts`)
- `fal` (`src/features/shopreel/video-creation/providers/fal.ts`)
- `runway` (`src/features/shopreel/video-creation/providers/runway.ts` and `runwayAdapter.ts`)
- `luma` placeholder
- `pika` placeholder
- `assembly` placeholder

## Environment variables referenced in code
- `OPENAI_API_KEY` (via `getOpenAIApiKey()` in `lib/env`)
- `SHOPREEL_MEDIA_PROVIDER_MODE` (via `getMediaProviderMode()` in `lib/env`)
- `FAL_KEY` (via `getFalApiKey()` in `lib/env`)
- `SHOPREEL_FAL_IMAGE_MODEL` (via `getShopreelFalImageModel()` in `lib/env`)
- `SHOPREEL_FAL_VIDEO_MODEL` (via `getShopreelFalVideoModel()` in `lib/env`)
- `RUNWAYML_API_SECRET` (runway client)
- `RUNWAY_MODEL` (optional runway model override)

## Current path usage
- Image generation path: campaign item media action creates `jobType: "image"` using provider `openai`.
- Video generation path: campaign item media action requires an existing generated image and creates `jobType: "video"` using provider `fal`, passing `start_image_url` in settings.

## Text-to-video and image-to-video status
- Text-to-video: supported in generic video providers (OpenAI/fal/runway adapters), but not the primary campaign-item UX path.
- Image-to-video: explicitly supported by fal when model is an image-to-video model and `start_image_url` is present.

## Missing-env warning behavior
- Provider adapters throw explicit configuration errors when required keys are missing (for example `fal.ai is not configured...`, `Missing RUNWAYML_API_SECRET`).

## Media Status UX
- Campaign detail page is the source of truth for media status and next actions.
- Job page is the detailed drill-down for provider/debug lifecycle information.
- Status meanings on campaign page:
  - Queued: request accepted, waiting to start.
  - Processing/submitted/running/rendering: generation is in progress.
  - Completed: usable output exists (preview URL or output asset).
  - Failed/canceled: generation stopped; retry image before video.
- Video unlock rule: Generate video is only enabled after image status is completed and has `previewUrl` or `outputAssetId`.

## Image output requirements
- Completed image jobs must store a usable `preview_url` or an `output_asset_id` that resolves to `content_assets.public_url`.
- Image job detail route renders image previews with `<img>` behavior; video/audio players are only for video jobs.
- Video unlock requires an image job in `completed` state plus usable preview/output asset wiring.
- If image provider reports completed but no URL/output asset is available, job should fail/warn instead of silent completion.

## Campaign media state sync
- The live `shopreel_media_generation_jobs` row is the source of truth for image/video status and output fields.
- `shopreel_campaign_items.metadata.media` is treated as cached state for quick reads and linkage.
- `GET /api/shopreel/campaigns/items/[id]/media` reconciles stale cached metadata when `image_job_id` exists and live status differs.
- Reconciliation is best-effort and does not fail the media response if metadata update fails.
- Broad backfills are only needed when `image_job_id` links are missing or no reliable item↔job relationship exists.
