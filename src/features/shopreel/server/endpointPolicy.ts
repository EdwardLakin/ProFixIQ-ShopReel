import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type EndpointCategory = "user-action" | "internal-worker" | "webhook";

export class ShopReelEndpointError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ShopReelEndpointError";
    this.status = status;
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
    throw new ShopReelEndpointError("Authentication required", 401);
  }

  const { data: membershipData } = await (admin as any)
    .from("shop_users")
    .select("shop_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const membership = (membershipData ?? null) as ShopMembershipRow | null;

  if (!membership?.shop_id) {
    throw new ShopReelEndpointError("Active shop membership is required", 403);
  }

  return {
    category: "user-action" as EndpointCategory,
    userId: user.id,
    shopId: membership.shop_id,
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
        error: error.message,
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
