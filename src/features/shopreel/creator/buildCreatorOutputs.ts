export type OutputType = "video" | "blog" | "email" | "post" | "vlog";

export type BlogStyle =
  | "auto"
  | "story_driven"
  | "educational"
  | "opinion"
  | "case_study"
  | "problem_solution";

export type BlogLengthMode = "short" | "standard" | "long";

export type CreatorAngle = {
  title: string;
  angle: string;
  hook: string;
  whyItWorks: string;
  suggestedCta: string;
};

export type EditorSection = {
  key: string;
  title: string;
  body: string;
};

export type CreatorTextOutputs = {
  blog: {
    title: string;
    style: Exclude<BlogStyle, "auto">;
    lengthMode: BlogLengthMode;
    body: string;
    sections: EditorSection[];
  };
  email: {
    subject: string;
    body: string;
    sections: EditorSection[];
  };
  post: {
    title: string;
    body: string;
    sections: EditorSection[];
  };
  vlog: {
    title: string;
    hook: string;
    talkingPoints: string[];
    bRoll: string[];
    sceneOrder: Array<{
      title: string;
      description: string;
      durationLabel: string;
    }>;
    closingCta: string;
    script: string;
  };
};

export function normalizeOutputType(value: unknown): OutputType {
  if (value === "blog" || value === "email" || value === "post" || value === "vlog") {
    return value;
  }
  return "video";
}

export function normalizeBlogStyle(value: unknown): BlogStyle {
  if (
    value === "story_driven" ||
    value === "educational" ||
    value === "opinion" ||
    value === "case_study" ||
    value === "problem_solution"
  ) {
    return value;
  }
  return "auto";
}

export function normalizeBlogLengthMode(value: unknown): BlogLengthMode {
  if (value === "short" || value === "long") return value;
  return "standard";
}

import { getEditorPath } from "@/features/shopreel/lib/editorPaths";

export function editorUrlForOutputType(outputType: OutputType, generationId: string): string {
  return getEditorPath(outputType, generationId);
}
