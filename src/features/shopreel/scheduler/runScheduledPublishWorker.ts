import { runPublishWorker } from "../publish/runPublishWorker";

export async function runScheduledPublishWorker(
  shopId: string,
  contentPieceId?: string | null
) {
  return runPublishWorker({
    shopId,
    contentPieceId: contentPieceId ?? null,
  });
}
