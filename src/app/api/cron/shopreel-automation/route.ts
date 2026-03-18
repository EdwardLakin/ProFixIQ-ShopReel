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

export async function GET() {
  try {
    const secret = process.env.SHOPREEL_AUTOMATION_SECRET;

    const res = await fetch(`${getBaseUrl()}/api/shopreel/automation/run`, {
      method: "POST",
      headers: secret
        ? {
            Authorization: `Bearer ${secret}`,
          }
        : {},
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: (json as { error?: string }).error ?? "Cron automation failed",
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
