"use client";

import type { ParsedCampaignBrief } from "@/features/shopreel/campaigns/lib/campaignIntakeTypes";

const STORAGE_KEY = "shopreel_campaign_command_handoff_v1";

export type CampaignCommandHandoff = {
  id: string;
  prompt: string;
  intent: "create_campaign";
  createdAt: string;
  source: "home_command" | "global_command";
  parsedBrief?: ParsedCampaignBrief;
};

type StoredHandoffs = Record<string, CampaignCommandHandoff>;

function readAll(): StoredHandoffs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredHandoffs;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(next: StoredHandoffs) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function createId() {
  const rand = Math.random().toString(36).slice(2, 10);
  return `ccm_${Date.now()}_${rand}`;
}

export function createCampaignCommandHandoff(input: {
  prompt: string;
  source: CampaignCommandHandoff["source"];
  parsedBrief?: ParsedCampaignBrief;
}) {
  const handoff: CampaignCommandHandoff = {
    id: createId(),
    prompt: input.prompt,
    intent: "create_campaign",
    createdAt: new Date().toISOString(),
    source: input.source,
    parsedBrief: input.parsedBrief,
  };
  const all = readAll();
  writeAll({ ...all, [handoff.id]: handoff });
  return handoff;
}

export function consumeCampaignCommandHandoff(id: string) {
  const all = readAll();
  const found = all[id] ?? null;
  if (!found) return null;
  delete all[id];
  writeAll(all);
  return found;
}
