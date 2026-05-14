export type CommandInputIntent =
  | "create_campaign"
  | "resume_campaign"
  | "edit_campaign"
  | "generate_content"
  | "unknown";

const RESUME_PATTERNS = [
  /\bresume\b/,
  /\bcontinue\b/,
  /\bopen previous\b/,
  /\bopen last\b/,
  /\brecover\b/,
  /\brestore\b/,
  /\bcontinue campaign\b/,
];

const CREATE_CAMPAIGN_PATTERNS = [
  /\bbuild (an? )?(advertising |marketing )?campaign\b/,
  /\bcreate (an? )?(advertising |marketing )?campaign\b/,
  /\bmake (me )?(an? )?(advertising |marketing )?campaign\b/,
  /\bplan (an? )?(advertising |marketing )?campaign\b/,
  /\badvertising plan\b/,
  /\bmarketing plan\b/,
  /\blaunch campaign\b/,
  /\bcampaign for\b/,
  /\bcampaign ideas?\b/,
  /\bgive me .*campaign ideas?\b/,
  /\bideas? for (an? )?(advertising |marketing )?campaign\b/,
  /\bpromote .*\b/,
  /\bmarket .*\b/,
];

const EDIT_CAMPAIGN_PATTERNS = [/\bedit campaign\b/, /\bupdate campaign\b/, /\brevise campaign\b/];
const GENERATE_CONTENT_PATTERNS = [
  /\bgenerate content\b/,
  /\bcreate content\b/,
  /\bcontent plan\b/,
  /\bvideo ideas\b/,
  /\bpost ideas\b/,
  /\breel ideas\b/,
  /\bshort form ideas\b/,
];

export function classifyCommandInputIntent(input: string): CommandInputIntent {
  const prompt = input.toLowerCase().trim();
  if (!prompt) return "unknown";

  if (RESUME_PATTERNS.some((pattern) => pattern.test(prompt))) return "resume_campaign";
  if (CREATE_CAMPAIGN_PATTERNS.some((pattern) => pattern.test(prompt))) return "create_campaign";
  if (EDIT_CAMPAIGN_PATTERNS.some((pattern) => pattern.test(prompt))) return "edit_campaign";
  if (GENERATE_CONTENT_PATTERNS.some((pattern) => pattern.test(prompt))) return "generate_content";

  return "unknown";
}

