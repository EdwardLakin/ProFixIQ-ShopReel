import test from "node:test";
import assert from "node:assert/strict";
import { validateCreateCampaignPayload } from "../route";

test("validateCreateCampaignPayload requires title", () => {
  assert.throws(
    () => validateCreateCampaignPayload({ title: "   ", coreIdea: "Goal" }),
    /Campaign title is required/
  );
});

test("validateCreateCampaignPayload requires coreIdea", () => {
  assert.throws(
    () => validateCreateCampaignPayload({ title: "Moment", coreIdea: "   " }),
    /Campaign goal\/brief is required/
  );
});

test("validateCreateCampaignPayload trims fields", () => {
  const result = validateCreateCampaignPayload({
    title: " Moment ",
    coreIdea: " engage users and encourage sign up ",
  });

  assert.equal(result.title, "Moment");
  assert.equal(result.coreIdea, "engage users and encourage sign up");
});
