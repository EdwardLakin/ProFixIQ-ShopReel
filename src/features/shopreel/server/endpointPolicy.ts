import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type EndpointCategory = "user-action" | "internal-worker" | "webhook";

export class ShopReelEndpointError extends Error {
  status: number;
  code: "SHOP_CONTEXT_REQUIRED" | "AUTH_REQUIRED" | "FORBIDDEN" | null;

  constructor(
    message: string,
    status = 400,
    code: "SHOP_CONTEXT_REQUIRED" | "AUTH_REQUIRED" | "FORBIDDEN" | null = null,
  ) {
    super(message);
    this.name = "ShopReelEndpointError";
    this.status = status;
    this.code = code;
  }
}

type ShopMembershipRow = {
  shop_id: string;
};

async function resolveShopIdFromStandaloneShopReelData(admin: unknown, userId: string): Promise<string | null> {
  const db = admin as { from: (table: string) => any };

  const { data: generationData } = await db
    .from("shopreel_story_generations")
    .select("shop_id")
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const generation = (generationData ?? null) as ShopMembershipRow | null;
  if (generation?.shop_id) return generation.shop_id;

  const { data: subscriptionData } = await db
    .from("shopreel_subscriptions")
    .select("shop_id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const subscription = (subscriptionData ?? null) as ShopMembershipRow | null;
  return subscription?.shop_id ?? null;
}

export async function requireUserActionTenantContext() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new ShopReelEndpointError("Authentication required", 401, "AUTH_REQUIRED");
  }

  const shopId = await resolveShopIdFromStandaloneShopReelData(admin, user.id);

  if (!shopId) {
    throw new ShopReelEndpointError("Active ShopReel workspace is required", 403, "FORBIDDEN");
  }

  return {
    category: "user-action" as EndpointCategory,
    userId: user.id,
    shopId,
  };
}

function getBearerToken(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim() || null;
}

export function requireInternalWorkerRequest(
  req: NextRequest | Request,
  options: {
    envSecretName: string;
    headerName?: string;
    errorMessage?: string;
  },
) {
  const expectedSecret = process.env[options.envSecretName];

  if (!expectedSecret) {
    throw new ShopReelEndpointError(
      `Missing required server secret: ${options.envSecretName}`,
      500,
    );
  }

  const headerSecret = req.headers.get(options.headerName ?? "x-shopreel-worker-secret");
  const bearerSecret = getBearerToken(req.headers.get("authorization"));

  if (headerSecret !== expectedSecret && bearerSecret !== expectedSecret) {
    throw new ShopReelEndpointError(
      options.errorMessage ?? "Unauthorized internal worker request",
      401,
    );
  }

  return {
    category: "internal-worker" as EndpointCategory,
  };
}

export function toEndpointErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ShopReelEndpointError) {
    return NextResponse.json(
      {
        ok: false,
        error: error.code ?? error.message,
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : fallbackMessage,
    },
    { status: 500 },
  );
}
