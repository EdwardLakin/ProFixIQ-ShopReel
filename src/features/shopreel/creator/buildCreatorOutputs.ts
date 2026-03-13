export type OutputType = "video" | "blog" | "email" | "post";

export type CreatorAngle = {
  title: string;
  angle: string;
  hook: string;
  whyItWorks: string;
  suggestedCta: string;
};

export type CreatorTextOutputs = {
  blog: {
    title: string;
    body: string;
  };
  email: {
    subject: string;
    body: string;
  };
  post: {
    title: string;
    body: string;
  };
};

export function normalizeOutputType(value: unknown): OutputType {
  if (value === "blog" || value === "email" || value === "post") return value;
  return "video";
}

export function editorUrlForOutputType(outputType: OutputType, generationId: string): string {
  if (outputType === "blog") return `/shopreel/editor/blog/${generationId}`;
  if (outputType === "email") return `/shopreel/editor/email/${generationId}`;
  if (outputType === "post") return `/shopreel/editor/post/${generationId}`;
  return `/shopreel/editor/${generationId}`;
}

export function buildCreatorTextOutputs(input: {
  topic: string;
  summary: string;
  bullets: string[];
  hook: string;
  context: string;
  explanation: string;
  takeaway: string;
  cta: string;
  angleTitle?: string | null;
  angleDescription?: string | null;
  audience?: string | null;
}): CreatorTextOutputs {
  const titleBase = input.angleTitle?.trim() || input.topic.trim() || "Generated content";
  const audienceLine = input.audience?.trim() ? `Audience: ${input.audience.trim()}` : null;
  const bulletLines = input.bullets.filter(Boolean).map((bullet) => `- ${bullet}`).join("\n");

  const blogTitle = titleBase;
  const blogBody = [
    `# ${blogTitle}`,
    "",
    input.summary,
    "",
    "## Key points",
    bulletLines || "- No key points available yet.",
    "",
    "## Breakdown",
    input.context,
    "",
    input.explanation,
    "",
    "## Why it matters",
    input.takeaway,
    "",
    "## Call to action",
    input.cta,
    audienceLine ? `\n${audienceLine}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const emailSubject = titleBase;
  const emailBody = [
    `Subject: ${emailSubject}`,
    "",
    input.hook,
    "",
    input.summary,
    "",
    input.context,
    "",
    input.explanation,
    "",
    "Why it matters:",
    input.takeaway,
    "",
    input.cta,
  ].join("\n");

  const postTitle = titleBase;
  const postBody = [
    input.hook,
    "",
    input.angleDescription?.trim() || input.summary,
    "",
    input.explanation,
    "",
    input.takeaway,
    "",
    input.cta,
  ].join("\n");

  return {
    blog: {
      title: blogTitle,
      body: blogBody,
    },
    email: {
      subject: emailSubject,
      body: emailBody,
    },
    post: {
      title: postTitle,
      body: postBody,
    },
  };
}
