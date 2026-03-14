import { generateOpportunities } from "../discovery/generateOpportunities";
import { runRenderWorker } from "../render/runRenderWorker";
import { runPublishWorker } from "../publish/runPublishWorker";
import { runScheduledPublishWorker } from "../scheduler/runScheduledPublishWorker";

export async function runAutomationLoop(shopId: string) {
  await generateOpportunities(shopId);

  await runScheduledPublishWorker();

  await runRenderWorker();

  await runPublishWorker();

  return {
    ok: true,
  };
}
