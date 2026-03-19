import RunwayML from "@runwayml/sdk";

export type RunwaySupportedModel =
  | "gen4.5"
  | "gen4_turbo";

export type RunwaySceneRequest = {
  promptText: string;
  promptImage: string;
  duration: 5 | 10;
  ratio?: "720:1280" | "1280:720" | "960:960";
  model?: RunwaySupportedModel;
};

export type RunwaySceneResult = {
  providerTaskId: string;
  status: string;
};

function getRunwayClient() {
  const apiKey = process.env.RUNWAYML_API_SECRET;
  if (!apiKey) {
    throw new Error("Missing RUNWAYML_API_SECRET");
  }
  return new RunwayML({ apiKey });
}

function getRunwayModel(): RunwaySupportedModel {
  const model = process.env.RUNWAY_MODEL;
  if (model === "gen4.5" || model === "gen4_turbo") {
    return model;
  }
  return "gen4_turbo";
}

export async function createRunwaySceneJob(
  input: RunwaySceneRequest
): Promise<RunwaySceneResult> {
  const client = getRunwayClient();

  const task = await client.imageToVideo.create({
    model: input.model ?? getRunwayModel(),
    promptText: input.promptText,
    promptImage: input.promptImage,
    duration: input.duration,
    ratio: input.ratio ?? "720:1280",
  });

  return {
    providerTaskId: task.id,
    status: "PENDING",
  };
}

export async function getRunwayTask(taskId: string) {
  const client = getRunwayClient();
  return client.tasks.retrieve(taskId);
}
