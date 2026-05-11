import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { buildVisualNarrativeDirection, nextEmotionalArcStage, scoreEmotionalRealism, selectHumanMoment } from "./narrativeIntelligence";

type PlannedScene = {
  sceneOrder: number;
  title: string;
  prompt: string;
  durationSeconds: number;
};

type CreativeProfile = {
  style?: string | null;
  visualMode?: string | null;
  aspectRatio?: string | null;
  durationSeconds?: number | null;
  cameraStyle?: string | null;
  lighting?: string | null;
  energy?: string | null;
};

type SceneStoryboard = {
  hook?: string;
  setup?: string;
  tension?: string;
  transition?: string;
  payoff?: string;
  cta?: string;
  pacing?: string;
  tone?: string;
  cameraFeel?: string;
  editRhythm?: string;
  textOverlayStyle?: string;
  transitionStyle?: string;
  musicEnergy?: string;
  platformAdaptation?: {
    tiktok?: string;
    reels?: string;
    shorts?: string;
  };
};

const SILENT_VISUAL_RULE =
  "No spoken dialogue. No voiceover. No subtitles. No captions. No on-screen text. Visual storytelling only.";

const CONTINUITY_RULE =
  "Maintain strong campaign continuity across every scene. Use the same visual world, same subject family, same environment family, same styling logic, same lighting family, same camera language, and same overall mood so all scenes feel like one cohesive ad campaign.";

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getCreativeProfileFromMetadata(metadata: unknown): CreativeProfile {
  const root = asObject(metadata);
  const creative = asObject(root.creative_profile);

  return {
    style:
      typeof creative.style === "string" ? creative.style : null,
    visualMode:
      typeof creative.visualMode === "string" ? creative.visualMode : null,
    aspectRatio:
      typeof creative.aspectRatio === "string" ? creative.aspectRatio : null,
    durationSeconds:
      typeof creative.durationSeconds === "number"
        ? creative.durationSeconds
        : null,
    cameraStyle:
      typeof creative.cameraStyle === "string" ? creative.cameraStyle : null,
    lighting:
      typeof creative.lighting === "string" ? creative.lighting : null,
    energy:
      typeof creative.energy === "string" ? creative.energy : null,
  };
}

function getNarrativeMetadata(metadata: unknown): { archetype: string; storyboard: SceneStoryboard } {
  const root = asObject(metadata);
  const intelligence = asObject(root.campaign_intelligence);
  const storyboard = asObject(intelligence.storyboard);
  const platform = asObject(storyboard.platformAdaptation);

  return {
    archetype:
      typeof intelligence.narrative_archetype === "string"
        ? intelligence.narrative_archetype
        : "cinematic",
    storyboard: {
      hook: typeof storyboard.hook === "string" ? storyboard.hook : undefined,
      setup: typeof storyboard.setup === "string" ? storyboard.setup : undefined,
      tension: typeof storyboard.tension === "string" ? storyboard.tension : undefined,
      transition: typeof storyboard.transition === "string" ? storyboard.transition : undefined,
      payoff: typeof storyboard.payoff === "string" ? storyboard.payoff : undefined,
      cta: typeof storyboard.cta === "string" ? storyboard.cta : undefined,
      pacing: typeof storyboard.pacing === "string" ? storyboard.pacing : undefined,
      tone: typeof storyboard.tone === "string" ? storyboard.tone : undefined,
      cameraFeel: typeof storyboard.cameraFeel === "string" ? storyboard.cameraFeel : undefined,
      editRhythm: typeof storyboard.editRhythm === "string" ? storyboard.editRhythm : undefined,
      textOverlayStyle: typeof storyboard.textOverlayStyle === "string" ? storyboard.textOverlayStyle : undefined,
      transitionStyle: typeof storyboard.transitionStyle === "string" ? storyboard.transitionStyle : undefined,
      musicEnergy: typeof storyboard.musicEnergy === "string" ? storyboard.musicEnergy : undefined,
      platformAdaptation: {
        tiktok: typeof platform.tiktok === "string" ? platform.tiktok : undefined,
        reels: typeof platform.reels === "string" ? platform.reels : undefined,
        shorts: typeof platform.shorts === "string" ? platform.shorts : undefined,
      },
    },
  };
}

function buildCreativeDirection(profile: CreativeProfile) {
  const parts = [
    profile.style ? `Overall style: ${profile.style}.` : "",
    profile.visualMode ? `Visual mode: ${profile.visualMode}.` : "",
    profile.aspectRatio ? `Aspect ratio: ${profile.aspectRatio}.` : "",
    profile.cameraStyle ? `Camera language: ${profile.cameraStyle}.` : "",
    profile.lighting ? `Lighting: ${profile.lighting}.` : "",
    profile.energy ? `Energy and pacing: ${profile.energy}.` : "",
    "Use the same subject type and same environment family throughout the full campaign.",
    "Keep the scenes visually matched, premium, and clearly part of the same ad.",
  ].filter(Boolean);

  return parts.join(" ");
}

export function planScenesForCampaignItem(args: {
  itemTitle: string;
  angle: string;
  prompt: string;
  creativeProfile?: CreativeProfile;
  narrativeArchetype?: string;
  storyboard?: SceneStoryboard;
  fallbackDurationSeconds?: number | null;
}): PlannedScene[] {
  const creativeProfile = args.creativeProfile ?? {};
  const durationSeconds = Math.max(
    3,
    Number(
      creativeProfile.durationSeconds ??
        args.fallbackDurationSeconds ??
        8
    )
  );

  const base = [
    args.prompt.trim(),
    CONTINUITY_RULE,
    buildCreativeDirection(creativeProfile),
    SILENT_VISUAL_RULE,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const visualDirection = buildVisualNarrativeDirection(args.angle);
  const arcStage = nextEmotionalArcStage();
  const toneKit = [
    args.narrativeArchetype ? `Narrative archetype: ${args.narrativeArchetype}.` : "",
    args.storyboard?.pacing ? `Pacing map: ${args.storyboard.pacing}.` : "",
    args.storyboard?.tone ? `Tone: ${args.storyboard.tone}.` : "",
    args.storyboard?.cameraFeel ? `Camera feel: ${args.storyboard.cameraFeel}.` : "",
    args.storyboard?.editRhythm ? `Edit rhythm: ${args.storyboard.editRhythm}.` : "",
    args.storyboard?.textOverlayStyle ? `Text overlay style: ${args.storyboard.textOverlayStyle}.` : "",
    args.storyboard?.transitionStyle ? `Transition style: ${args.storyboard.transitionStyle}.` : "",
    args.storyboard?.musicEnergy ? `Music energy arc: ${args.storyboard.musicEnergy}.` : "",
    args.storyboard?.platformAdaptation?.tiktok ? `TikTok pacing: ${args.storyboard.platformAdaptation.tiktok}.` : "",
    args.storyboard?.platformAdaptation?.reels ? `Instagram Reels pacing: ${args.storyboard.platformAdaptation.reels}.` : "",
    args.storyboard?.platformAdaptation?.shorts ? `YouTube Shorts pacing: ${args.storyboard.platformAdaptation.shorts}.` : "",
    `Visual narrative intelligence: framing(${visualDirection.framing}), lens(${visualDirection.lensStyle}), distance(${visualDirection.cameraDistance}), movement(${visualDirection.cameraMovement}), lighting(${visualDirection.lightingMood}), texture(${visualDirection.textureRealism}), composition(${visualDirection.environmentComposition}).`,
    `Continuity memory stage: ${arcStage}. Ensure emotional progression from prior scenes without repeating identical behavior loops.`,
  ].filter(Boolean).join(" ");

  return [
    {
      sceneOrder: 1,
      title: `${args.itemTitle} — Hook`,
      prompt: `${base} ${toneKit} Story beat: Hook. ${args.storyboard?.hook ?? "Create an emotionally believable opening moment in the first 2 seconds."} Human moment seed: ${selectHumanMoment(args.prompt, 1).momentType}; behavior(${selectHumanMoment(args.prompt, 1).physicalBehavior}); environment(${selectHumanMoment(args.prompt, 1).environmentDetail}); sensory(${selectHumanMoment(args.prompt, 1).sensoryCue}); hesitation(${selectHumanMoment(args.prompt, 1).hesitation}); inner monologue(${selectHumanMoment(args.prompt, 1).internalMonologue ?? "none"}). Scene objective: create a powerful opening hook with a specific human scenario, not a generic claim.`,
      durationSeconds,
    },
    {
      sceneOrder: 2,
      title: `${args.itemTitle} — Problem`,
      prompt: `${base} ${toneKit} Story beat: Setup + Tension. ${args.storyboard?.setup ?? "Ground the viewer in a concrete context."} ${args.storyboard?.tension ?? "Escalate pressure through visible friction."} Human moment seed: ${selectHumanMoment(args.prompt, 2).momentType}; behavior(${selectHumanMoment(args.prompt, 2).physicalBehavior}); interruption(${selectHumanMoment(args.prompt, 2).interruption}); inner monologue(${selectHumanMoment(args.prompt, 2).internalMonologue ?? "none"}). Scene objective: show contextual realism and emotional pressure with cinematic continuity.`,
      durationSeconds,
    },
    {
      sceneOrder: 3,
      title: `${args.itemTitle} — Solution`,
      prompt: `${base} ${toneKit} Story beat: Transition. ${args.storyboard?.transition ?? "Use a visual pivot to shift from stuck to momentum."} Human moment seed: ${selectHumanMoment(args.prompt, 3).momentType}; trigger(${selectHumanMoment(args.prompt, 3).emotionalTrigger}); pacing(${selectHumanMoment(args.prompt, 3).pacing}). Scene objective: show the turning point with platform-native pacing and visual clarity.`,
      durationSeconds,
    },
    {
      sceneOrder: 4,
      title: `${args.itemTitle} — Outcome`,
      prompt: `${base} ${toneKit} Story beat: Payoff + CTA. ${args.storyboard?.payoff ?? "Show the emotional and practical payoff."} ${args.storyboard?.cta ?? "End with a calm, actionable CTA."} Human moment seed: ${selectHumanMoment(args.prompt, 4).momentType}; recovery behavior(${selectHumanMoment(args.prompt, 4).physicalBehavior}); dialogue style(${selectHumanMoment(args.prompt, 4).dialogueStyle}). Scene objective: close with believable emotional release and a concise next step.`,
      durationSeconds,
    },
  ];
}

export async function ensureScenesForCampaignItem(campaignItemId: string) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: item, error: itemError } = await supabase
    .from("shopreel_campaign_items")
    .select("*")
    .eq("id", campaignItemId)
    .eq("shop_id", shopId)
    .single();

  if (itemError || !item) {
    throw new Error(itemError?.message ?? "Campaign item not found");
  }

  const creativeProfile = getCreativeProfileFromMetadata(item.metadata);
  const narrative = getNarrativeMetadata(item.metadata);

  const plannedScenes = planScenesForCampaignItem({
    itemTitle: item.title,
    angle: item.angle,
    prompt: item.prompt,
    creativeProfile,
    narrativeArchetype: narrative.archetype,
    storyboard: narrative.storyboard,
    fallbackDurationSeconds: item.duration_seconds,
  });

  const { data: existingScenes, error: scenesError } = await supabase
    .from("shopreel_campaign_item_scenes")
    .select("*")
    .eq("campaign_item_id", campaignItemId)
    .eq("shop_id", shopId)
    .order("scene_order", { ascending: true });

  if (scenesError) {
    throw new Error(scenesError.message);
  }

  if ((existingScenes ?? []).length === 0) {
    const { data: insertedScenes, error: insertError } = await supabase
      .from("shopreel_campaign_item_scenes")
      .insert(
        plannedScenes.map((scene) => ({
          campaign_item_id: item.id,
          campaign_id: item.campaign_id,
          shop_id: item.shop_id,
          scene_order: scene.sceneOrder,
          title: scene.title,
          prompt: scene.prompt,
          duration_seconds: scene.durationSeconds,
          status: "draft",
        }))
      )
      .select("*");

    if (insertError) {
      throw new Error(insertError.message);
    }

    return insertedScenes ?? [];
  }

  for (const planned of plannedScenes) {
    const existing = (existingScenes ?? []).find(
      (scene) => scene.scene_order === planned.sceneOrder
    );

    if (!existing) {
      const { error: insertMissingError } = await supabase
        .from("shopreel_campaign_item_scenes")
        .insert({
          campaign_item_id: item.id,
          campaign_id: item.campaign_id,
          shop_id: item.shop_id,
          scene_order: planned.sceneOrder,
          title: planned.title,
          prompt: planned.prompt,
          duration_seconds: planned.durationSeconds,
          status: "draft",
        });

      if (insertMissingError) {
        throw new Error(insertMissingError.message);
      }

      continue;
    }

    const { error: repairError } = await supabase
      .from("shopreel_campaign_item_scenes")
      .update({
        title: planned.title,
        prompt: planned.prompt,
        duration_seconds: planned.durationSeconds,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (repairError) {
      throw new Error(repairError.message);
    }
  }

  const { data: refreshedScenes, error: refreshError } = await supabase
    .from("shopreel_campaign_item_scenes")
    .select("*")
    .eq("campaign_item_id", campaignItemId)
    .eq("shop_id", shopId)
    .order("scene_order", { ascending: true });

  if (refreshError) {
    throw new Error(refreshError.message);
  }

  return refreshedScenes ?? [];
}

export async function createMediaJobsForCampaignItemScenes(campaignItemId: string) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: item, error: itemError } = await supabase
    .from("shopreel_campaign_items")
    .select("*")
    .eq("id", campaignItemId)
    .eq("shop_id", shopId)
    .single();

  if (itemError || !item) {
    throw new Error(itemError?.message ?? "Campaign item not found");
  }

  const creativeProfile = getCreativeProfileFromMetadata(item.metadata);
  const scenes = await ensureScenesForCampaignItem(campaignItemId);
  const createdJobIds: string[] = [];

  for (const scene of scenes) {
    if (scene.media_job_id) {
      await supabase
        .from("shopreel_campaign_item_scenes")
        .update({
          media_job_id: null,
          status: "draft",
          output_asset_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", scene.id);

      const { data: existingJobs } = await supabase
        .from("shopreel_media_generation_jobs")
        .select("id, settings")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });

      const staleJobIds =
        (existingJobs ?? [])
          .filter((job) => {
            const settings =
              job.settings &&
              typeof job.settings === "object" &&
              !Array.isArray(job.settings)
                ? (job.settings as Record<string, unknown>)
                : null;

            return (
              settings?.campaign_item_id === item.id &&
              settings?.scene_id === scene.id
            );
          })
          .map((job) => job.id);

      if (staleJobIds.length > 0) {
        await supabase
          .from("shopreel_media_generation_jobs")
          .delete()
          .in("id", staleJobIds)
          .eq("shop_id", shopId);
      }
    }

    const sceneRealism = scoreEmotionalRealism(scene.prompt ?? "");
    const { data: mediaJob, error: mediaJobError } = await supabase
      .from("shopreel_media_generation_jobs")
      .insert({
        shop_id: shopId,
        created_by: null,
        source_content_piece_id: item.content_piece_id,
        provider: "openai",
        job_type: "video",
        status: "queued",
        prompt: scene.prompt,
        prompt_enhanced: scene.prompt,
        negative_prompt: item.negative_prompt,
        title: scene.title,
        style: item.style,
        visual_mode: item.visual_mode,
        aspect_ratio: item.aspect_ratio,
        duration_seconds: scene.duration_seconds ?? item.duration_seconds ?? 8,
        input_asset_ids: [],
        settings: {
          campaign_item_id: item.id,
          campaign_id: item.campaign_id,
          scene_id: scene.id,
          scene_order: scene.scene_order,
          assembly_mode: "multi_scene",
          pipeline: "sora_scene",
          silent_visuals_only: true,
          creative_profile: creativeProfile,
          emotional_realism: sceneRealism,
          realism_gate: sceneRealism.realismScore >= 55 ? "pass" : "revise",
        },
      })
      .select("*")
      .single();

    if (mediaJobError || !mediaJob) {
      throw new Error(mediaJobError?.message ?? "Failed to create scene media job");
    }

    const { error: updateSceneError } = await supabase
      .from("shopreel_campaign_item_scenes")
      .update({
        media_job_id: mediaJob.id,
        status: "queued",
        updated_at: new Date().toISOString(),
      })
      .eq("id", scene.id);

    if (updateSceneError) {
      throw new Error(updateSceneError.message);
    }

    createdJobIds.push(mediaJob.id);
  }

  return createdJobIds;
}
