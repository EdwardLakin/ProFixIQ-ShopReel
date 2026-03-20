type SceneLike = {
  id: string;
  status?: string | null;
  output_asset_id?: string | null;
};

type ItemLike = {
  id: string;
  status?: string | null;
  final_output_asset_id?: string | null;
  scenes?: SceneLike[] | null;
};

export type CampaignProgressSummary = {
  totalVideos: number;
  videosWithScenes: number;
  videosReady: number;
  sceneVideosReady: number;
  totalSceneVideos: number;
  stage:
    | "not_started"
    | "scenes_planned"
    | "creating_videos"
    | "ready_to_publish";
  stageLabel: string;
};

export function getCampaignProgressSummary(
  items: ItemLike[]
): CampaignProgressSummary {
  const totalVideos = items.length;
  const videosWithScenes = items.filter(
    (item) => (item.scenes ?? []).length > 0
  ).length;

  const allScenes = items.flatMap((item) => item.scenes ?? []);
  const totalSceneVideos = allScenes.length;
  const sceneVideosReady = allScenes.filter((scene) => {
    const status = (scene.status ?? "").toLowerCase();
    return status === "completed" && !!scene.output_asset_id;
  }).length;

  const videosReady = items.filter((item) => !!item.final_output_asset_id).length;

  let stage: CampaignProgressSummary["stage"] = "not_started";
  let stageLabel = "Not started";

  if (totalVideos === 0 || videosWithScenes === 0) {
    stage = "not_started";
    stageLabel = "Build scenes";
  } else if (videosReady === totalVideos && totalVideos > 0) {
    stage = "ready_to_publish";
    stageLabel = "Ready to publish";
  } else if (sceneVideosReady > 0 || totalSceneVideos > 0) {
    stage = "creating_videos";
    stageLabel = "Creating videos";
  } else {
    stage = "scenes_planned";
    stageLabel = "Scenes planned";
  }

  return {
    totalVideos,
    videosWithScenes,
    videosReady,
    sceneVideosReady,
    totalSceneVideos,
    stage,
    stageLabel,
  };
}
