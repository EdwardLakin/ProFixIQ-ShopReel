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

export async function requireUserActionTenantContext() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new ShopReelEndpointError("Authentication required", 401, "AUTH_REQUIRED");
  }

  const { data: settingsData } = await (admin as any)
    .from("shop_reel_settings")
    .select("shop_id")
    .order("shop_id", { ascending: true })
    .limit(1)
    .maybeSingle();

  const settingsRow = (settingsData ?? null) as { shop_id: string } | null;

  if (settingsRow?.shop_id) {
    return {
      category: "user-action" as EndpointCategory,
      userId: user.id,
      shopId: settingsRow.shop_id,
    };
  }

  throw new ShopReelEndpointError("Shop context required", 401, "SHOP_CONTEXT_REQUIRED");
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
