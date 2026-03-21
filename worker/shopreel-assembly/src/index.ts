import { runWorkerLoop } from "./jobs/processPremiumAssemblyJob.js";

runWorkerLoop().catch((error) => {
  console.error("[assembly-worker] fatal", error);
  process.exit(1);
});
