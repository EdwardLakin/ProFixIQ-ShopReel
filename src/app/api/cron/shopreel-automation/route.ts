import { NextResponse } from "next/server";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL?.startsWith("http")
      ? process.env.VERCEL_URL
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
  );
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export async function GET() {
  try {
    const secret = process.env.SHOPREEL_AUTOMATION_SECRET;
    const shopId = process.env.SHOPREEL_AUTOMATION_SHOP_ID;
    const baseUrl = normalizeBaseUrl(getBaseUrl());
    const automationUrl = `${baseUrl}/api/shopreel/automation/run`;

    console.log("[shopreel-cron] started", {
      hasAutomationSecret: Boolean(secret),
      hasAutomationShopId: Boolean(shopId),
      baseUrl,
      automationUrl,
    });

    if (!secret) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing SHOPREEL_AUTOMATION_SECRET",
        },
        { status: 500 }
      );
    }

    if (!shopId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing SHOPREEL_AUTOMATION_SHOP_ID",
        },
        { status: 500 }
      );
    }

    const res = await fetch(automationUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "x-shopreel-worker-secret": secret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ shopId }),
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));

    console.log("[shopreel-cron] downstream response", {
      status: res.status,
      ok: res.ok,
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: (json as { error?: string }).error ?? "Cron automation failed",
          downstreamStatus: res.status,
          downstreamJson: json,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      ok: true,
      ...(json as Record<string, unknown>),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to execute cron automation",
      },
      { status: 500 }
    );
  }
}
