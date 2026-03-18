Required env vars for ShopReel automation:

SHOPREEL_AUTOMATION_SECRET=replace-with-long-random-secret
OPENAI_API_KEY=your-openai-key
SHOPREEL_GENERATED_MEDIA_BUCKET=shopreel-generated-media
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

Vercel Cron route:
GET /api/cron/shopreel-automation

Internal protected automation route:
POST /api/shopreel/automation/run
Authorization: Bearer $SHOPREEL_AUTOMATION_SECRET
