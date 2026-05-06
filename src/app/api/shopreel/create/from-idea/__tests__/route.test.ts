import test from "node:test";
import assert from "node:assert/strict";
import type { CreativeBrief } from "@/features/shopreel/manual/lib/creativeBrief";
import {
  forceUsablePlatformCopy,
  normalizeGeneratedPayload,
  looksLikeStrategyNotes,
} from "../route";

const brief: CreativeBrief = {
  productName: "PayProof",
  audience: "Flat-rate technicians",
  primaryPainPoint: "Techs forget exact RO and approved time before payday",
  primaryValueProp: "PayProof keeps RO details, approved time, and notes organized",
  proofPoints: ["Track RO", "Store approved time", "Keep pay notes"],
  emotionalPromise: "stay calm and professional",
  tone: "confident",
  ctaGoal: "Start tracking your proof before payday.",
  platformStrategy: {},
  positioningSummary: "Keep records clear so pay conversations stay factual.",
  alternateHooks: ["Bring the RO, not a guess."],
};

test("banned strategy phrases are detected", () => {
  assert.equal(looksLikeStrategyNotes("The campaign should focus on trust."), true);
  assert.equal(looksLikeStrategyNotes("Payday records should be ready before the question."), false);
});

test("fallback replaces strategy-like copy and avoids prompt duplication", () => {
  const output = forceUsablePlatformCopy({
    platformId: "instagram_reels",
    brief,
    originalPrompt: "Why this works: reduce tension. CTA: bring the RO number.",
    output: {
      hook: "Why this works: reduce tension",
      body: "The campaign should focus on clear communication",
      cta: "CTA: bring the RO",
      caption: "position the content around respectful communication",
      hashtags: [],
    },
  });

  assert.equal(looksLikeStrategyNotes(`${output.hook} ${output.body} ${output.cta} ${output.caption}`), false);
  assert.notEqual(output.caption, "position the content around respectful communication");
});

test("instagram and facebook output normalize differently", () => {
  const parsed = normalizeGeneratedPayload(
    {
      hook: "Bring the RO",
      caption: "Bring the RO",
      scriptText: "strategy: focus on target audience",
      voiceoverText: "the campaign should",
      platformOutputs: {
        instagram_reels: { hook: "Don\'t guess", body: "PayProof keeps records ready.", cta: "CTA: Start", caption: "why this works", hashtags: [] },
        facebook_reels: { hook: "Don\'t guess", body: "PayProof keeps records ready.", cta: "CTA: Start", caption: "why this works", hashtags: [] },
      },
    },
    brief,
    ["instagram_reels", "facebook_reels"],
    "Why this works: reduce tension. CTA: bring the RO number.",
  );

  const ig = parsed.platformOutputs.instagram_reels!;
  const fb = parsed.platformOutputs.facebook_reels!;
  assert.notEqual(`${ig.hook} ${ig.body}`, `${fb.hook} ${fb.body}`);
  assert.equal(looksLikeStrategyNotes(parsed.scriptText), false);
});
