export type CommandIntentClassification =
  | "continue_existing_work"
  | "operate_existing_workflow"
  | "create_new_content_brief"
  | "create_new_campaign_brief"
  | "review_or_publish_existing_asset"
  | "ambiguous_needs_choice";

export type CommandIntentDecision = {
  classification: CommandIntentClassification;
  confidence: "high" | "medium";
  explainability: string[];
  normalizedPrompt: string;
  hasContinuitySignals: boolean;
  hasCreativeBriefSignals: boolean;
};

const CONTINUITY_PATTERNS = [
  /\bcontinue\b/,
  /\bresume\b/,
  /\blatest\b/,
  /\brecent\b/,
  /\bopen latest\b/,
  /\bcurrent work\b/,
  /\bcontinuity\b/,
  /\binterrupted\b/,
  /\brestore\b/,
  /\breview continuity\b/,
  /\bopen .*queue\b/,
];

const OPERATIONAL_PATTERNS = [
  /\bshow failed renders?\b/,
  /\bopen render queue\b/,
  /\bcheck blockers?\b/,
  /\breview exports?\b/,
  /\bpackage ready assets?\b/,
  /\bpublish queue\b/,
  /\bneed attention\b/,
  /\bstabilize\b/,
];

const PUBLISH_REVIEW_PATTERNS = [/\bpublish\b/, /\bexport\b/, /\bpackage\b/, /\breview\b.*\basset/];

const CONTENT_BRIEF_PATTERNS = [
  /\bi['’]?m building\b/,
  /\bi want help generating\b/,
  /\bshort[- ]form video ideas\b/,
  /\bhooks?\b/,
  /\btiktok\b/,
  /\breels?\b/,
  /\bcreator storytelling\b/,
  /\blanding page messaging\b/,
  /\bbrand positioning\b/,
  /\bvisual identity\b/,
  /\btrailer concepts?\b/,
  /\blaunch messaging\b/,
  /\bcontent plan\b/,
  /\bproduct launch\b/,
  /\bcampaign concepts?\b/,
  /\bmarketing\b/,
];

const CAMPAIGN_BRIEF_PATTERNS = [/\bcampaign\b/, /\blaunch\b/, /\bgo[- ]to[- ]market\b/, /\bpositioning\b/, /\baudience\b/, /\bmessaging\b/];

export function classifyCommandIntent(input: string): CommandIntentDecision {
  const normalizedPrompt = input.toLowerCase().trim();
  if (!normalizedPrompt) {
    return {
      classification: "operate_existing_workflow",
      confidence: "medium",
      explainability: ["No prompt text; defaulting to operational workspace command mode."],
      normalizedPrompt,
      hasContinuitySignals: false,
      hasCreativeBriefSignals: false,
    };
  }

  const continuityHits = CONTINUITY_PATTERNS.filter((pattern) => pattern.test(normalizedPrompt)).length;
  const operationalHits = OPERATIONAL_PATTERNS.filter((pattern) => pattern.test(normalizedPrompt)).length;
  const creativeHits = CONTENT_BRIEF_PATTERNS.filter((pattern) => pattern.test(normalizedPrompt)).length;
  const campaignHits = CAMPAIGN_BRIEF_PATTERNS.filter((pattern) => pattern.test(normalizedPrompt)).length;
  const publishHits = PUBLISH_REVIEW_PATTERNS.filter((pattern) => pattern.test(normalizedPrompt)).length;

  const tokenCount = normalizedPrompt.split(/\s+/).filter(Boolean).length;
  const longNarrative = tokenCount >= 28 || normalizedPrompt.includes("\n");
  const hasContinuitySignals = continuityHits > 0 || operationalHits > 0;
  const hasCreativeBriefSignals = creativeHits > 0 || campaignHits > 1 || longNarrative;

  if (hasContinuitySignals && hasCreativeBriefSignals) {
    return {
      classification: "ambiguous_needs_choice",
      confidence: "medium",
      explainability: ["Prompt contains both continuity/operational and creative-brief signals."],
      normalizedPrompt,
      hasContinuitySignals,
      hasCreativeBriefSignals,
    };
  }

  if (publishHits > 0 && !hasCreativeBriefSignals) {
    return {
      classification: "review_or_publish_existing_asset",
      confidence: "high",
      explainability: ["Publish/export review vocabulary detected without creative brief structure."],
      normalizedPrompt,
      hasContinuitySignals,
      hasCreativeBriefSignals,
    };
  }

  if (hasCreativeBriefSignals) {
    const classification = campaignHits > 0 ? "create_new_campaign_brief" : "create_new_content_brief";
    return {
      classification,
      confidence: longNarrative || creativeHits > 1 ? "high" : "medium",
      explainability: ["Creative brief vocabulary and narrative prompt structure detected."],
      normalizedPrompt,
      hasContinuitySignals,
      hasCreativeBriefSignals,
    };
  }

  if (continuityHits > 0 && operationalHits === 0) {
    return {
      classification: "continue_existing_work",
      confidence: "high",
      explainability: ["Continuation keywords detected."],
      normalizedPrompt,
      hasContinuitySignals,
      hasCreativeBriefSignals,
    };
  }

  return {
    classification: "operate_existing_workflow",
    confidence: operationalHits > 0 ? "high" : "medium",
    explainability: [operationalHits > 0 ? "Operational workflow command detected." : "Falling back to deterministic operational routing."],
    normalizedPrompt,
    hasContinuitySignals,
    hasCreativeBriefSignals,
  };
}
