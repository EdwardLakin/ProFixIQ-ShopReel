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

export type CampaignNextAction =
  | "build_scenes"
  | "create_videos"
  | "check_progress"
  | "publish";

export type CampaignNextActionInfo = {
  action: CampaignNextAction;
  label: string;
  description: string;
};

export function getCampaignNextAction(items: ItemLike[]): CampaignNextActionInfo {
  if (!items.length) {
    return {
      action: "build_scenes",
      label: "Build scenes",
      description: "Create the scene plan for this campaign.",
    };
  }

  const allScenes = items.flatMap((item) => item.scenes ?? []);
  const hasNoScenes = items.some((item) => !item.scenes || item.scenes.length === 0);

  if (hasNoScenes || allScenes.length === 0) {
    return {
      action: "build_scenes",
      label: "Build scenes",
      description: "Create the scene plan for each campaign video.",
    };
  }

  const hasPendingSceneOutputs = allScenes.some(
    (scene) => !scene.output_asset_id || (scene.status ?? "").toLowerCase() !== "completed"
  );

  if (hasPendingSceneOutputs) {
    const hasNeverStarted = allScenes.some((scene) => {
      const status = (scene.status ?? "").toLowerCase();
      return !status || status === "queued" || status === "pending" || status === "draft";
    });

    if (hasNeverStarted) {
      return {
        action: "create_videos",
        label: "Create videos",
        description: "Start generating the campaign scene videos.",
      };
    }

    return {
      action: "check_progress",
      label: "Check progress",
      description: "Refresh statuses and assemble completed items.",
    };
  }

  const hasMissingFinalVideos = items.some((item) => !item.final_output_asset_id);

  if (hasMissingFinalVideos) {
    return {
      action: "check_progress",
      label: "Check progress",
      description: "Assemble finished scenes into final campaign videos.",
    };
  }

  return {
    action: "publish",
    label: "Publish campaign",
    description: "Everything is ready. Review and publish your videos.",
  };
}
