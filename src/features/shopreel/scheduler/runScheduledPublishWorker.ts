import { runPublishWorker } from "../publish/runPublishWorker";

export async function runScheduledPublishWorker(
  contentPieceId?: string | null
) {
  return runPublishWorker(contentPieceId ?? null);
}
