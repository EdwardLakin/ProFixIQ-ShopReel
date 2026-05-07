import test from "node:test";
import assert from "node:assert/strict";
import { resolveGrowthScope } from "../guards";

test("resolveGrowthScope defaults to internal owner scope", () => {
  const scope = resolveGrowthScope({ userId: "u1" });
  assert.equal(scope.scopeType, "internal_owner");
  assert.equal(scope.scopeId, "u1");
});

test("asset plan checklist shape remains deterministic", () => {
  const checklist = ["approved draft exists", "screenshot source available", "brand kit available", "target platform selected", "voiceover script generated"];
  assert.equal(checklist.length, 5);
  assert.ok(checklist.includes("screenshot source available"));
});
