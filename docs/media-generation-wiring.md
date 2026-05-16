# Campaign media generation wiring

Main campaign flow is **approved package → image → video**. Text-to-video may exist in provider APIs, but it is not the canonical campaign-item flow in this phase.

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
