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
  /\bbuild (an? )?(advertising )?campaign\b/,
  /\bcreate (an? )?campaign\b/,
  /\bplan (an? )?(advertising )?campaign\b/,
  /\badvertising plan\b/,
  /\blaunch campaign\b/,
  /\bcampaign for\b/,
];

const EDIT_CAMPAIGN_PATTERNS = [/\bedit campaign\b/, /\bupdate campaign\b/, /\brevise campaign\b/];
const GENERATE_CONTENT_PATTERNS = [/\bgenerate content\b/, /\bcreate content\b/, /\bcontent plan\b/, /\bvideo ideas\b/];

export function classifyCommandInputIntent(input: string): CommandInputIntent {
  const prompt = input.toLowerCase().trim();
  if (!prompt) return "unknown";

  if (RESUME_PATTERNS.some((pattern) => pattern.test(prompt))) return "resume_campaign";
  if (CREATE_CAMPAIGN_PATTERNS.some((pattern) => pattern.test(prompt))) return "create_campaign";
  if (EDIT_CAMPAIGN_PATTERNS.some((pattern) => pattern.test(prompt))) return "edit_campaign";
  if (GENERATE_CONTENT_PATTERNS.some((pattern) => pattern.test(prompt))) return "generate_content";

  return "unknown";
}

