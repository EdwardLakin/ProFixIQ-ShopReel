type DecisionMode = "approve" | "reject" | "refine";

export type AdaptiveMemoryEvent = {
  action: "approved" | "rejected" | "canceled";
  reason: string | null;
  createdAt: string;
  campaignId: string | null;
  metadata?: {
    decisionMode?: string;
    refinementSignal?: string | null;
  } | null;
};

export type AdaptiveMemorySnapshot = {
  learnedNotices: string[];
  tasteSummary: string[];
  continuityNotice: string | null;
};

const SIGNAL_PATTERNS: Array<{ key: string; matcher: RegExp; label: string }> = [
  { key: "less_corporate", matcher: /corporate|scripted|stiff/i, label: "Less corporate phrasing" },
  { key: "stronger_hook", matcher: /stronger hook|hook|opening|first seconds/i, label: "Stronger narrative openings" },
  { key: "calmer_pacing", matcher: /calm|slower|breathe|space|less aggressive/i, label: "Calmer pacing and energy" },
  { key: "more_energy", matcher: /more energy|faster|punchier|higher energy/i, label: "More energetic pacing" },
  { key: "conversational", matcher: /conversational|natural|authentic|human/i, label: "Conversational, human voice" },
  { key: "platform_tiktok", matcher: /tiktok/i, label: "Platform-specific TikTok hook style" },
];

function normalizeDecisionMode(event: AdaptiveMemoryEvent): DecisionMode {
  if (event.metadata?.decisionMode === "approve") return "approve";
  if (event.metadata?.decisionMode === "refine") return "refine";
  if (event.action === "approved") return "approve";
  return "reject";
}

export function buildAdaptiveCreativeMemory(events: AdaptiveMemoryEvent[]): AdaptiveMemorySnapshot {
  const recent = [...events]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  const signalCount = new Map<string, number>();
  let approvals = 0;
  let refinements = 0;

  for (const event of recent) {
    const mode = normalizeDecisionMode(event);
    if (mode === "approve") approvals += 1;
    if (mode === "refine") refinements += 1;
    const text = `${event.reason ?? ""} ${event.metadata?.refinementSignal ?? ""}`;
    for (const pattern of SIGNAL_PATTERNS) {
      if (pattern.matcher.test(text)) {
        signalCount.set(pattern.key, (signalCount.get(pattern.key) ?? 0) + 1);
      }
    }
  }

  const topSignals = SIGNAL_PATTERNS
    .map((pattern) => ({ ...pattern, score: signalCount.get(pattern.key) ?? 0 }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const tasteSummary = topSignals.map((signal) => signal.label);
  const learnedNotices: string[] = [];
  if (tasteSummary[0]) learnedNotices.push(`Adjusted from recent decisions: ${tasteSummary[0]}.`);
  if (tasteSummary[1]) learnedNotices.push(`Continuing your preference for ${tasteSummary[1].toLowerCase()}.`);
  if (approvals > 0 && refinements > 0) learnedNotices.push("Balancing approved direction with your latest refinement requests.");

  const continuityNotice = topSignals[0]
    ? `Current proposal reflects your recent ${topSignals[0].label.toLowerCase()} feedback.`
    : approvals > 0
      ? "Current proposal follows patterns from your recent approvals."
      : null;

  return { learnedNotices, tasteSummary, continuityNotice };
}
