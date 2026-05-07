# ShopReel Video Generation Setup (Railway)

ShopReel's canonical video creation flow (`/shopreel/video-creation/advanced`) requires these environment variables:

- `SHOPREEL_RAILWAY_VIDEO_BASE_URL`
- `SHOPREEL_RAILWAY_VIDEO_API_KEY`
- `OPENAI_API_KEY`
- `SHOPREEL_GENERATED_MEDIA_BUCKET`

## Required variables

### `SHOPREEL_RAILWAY_VIDEO_BASE_URL`
Use the deployed Railway video service base URL.

Example:

```txt
https://your-railway-service.up.railway.app
```

### `SHOPREEL_RAILWAY_VIDEO_API_KEY`
Use a shared secret that you generate and set in **both** places:

1. ShopReel environment (Vercel/Codespaces/local `.env`)
2. Railway video service environment

### `OPENAI_API_KEY`
Required for prompt enhancement and OpenAI-backed generation paths.

### `SHOPREEL_GENERATED_MEDIA_BUCKET`
Supabase storage bucket used to persist generated output assets.

## Generate a secure API key

```bash
npm run shopreel:video:key
```

The command outputs a 64-char hex key and instructions. Do not commit secrets.
