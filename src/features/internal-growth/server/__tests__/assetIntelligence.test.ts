import test from "node:test";
import assert from "node:assert/strict";
import { calculateRenderReadiness, generateScreenshotRequests, generateStarterComposition } from "../assetIntelligence";

test("screenshot requests deterministic", () => {
  const reqs = generateScreenshotRequests("feature_launch", "instagram");
  assert.equal(reqs.length, 5);
  assert.equal(reqs[0]?.title, "Dashboard KPI hero");
});

test("composition generation deterministic", () => {
  const comp = generateStarterComposition("carousel", "Growth pack");
  assert.equal(comp.scenes.length, 5);
  assert.equal(comp.scenes[0]?.name, "Cover");
});

test("readiness validation catches missing blockers", () => {
  const out = calculateRenderReadiness({ screenshotRequests: [{ status: "requested" }], assetSources: [], composition: { captions: [], aspect_ratio: "9:16" }, brandKit: null, storyboard: { beats: [] } });
  assert.equal(out.ready, false);
  assert.ok(out.blockers.includes("missing screenshots"));
});
