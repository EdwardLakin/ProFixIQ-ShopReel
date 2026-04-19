import { NextResponse } from "next/server";

export function withDeprecatedApiHeaders(
  response: NextResponse,
  replacement: string,
  note?: string,
): NextResponse {
  response.headers.set("x-shopreel-api-status", "deprecated");
  response.headers.set("x-shopreel-api-replacement", replacement);
  if (note) {
    response.headers.set("x-shopreel-api-note", note);
  }
  return response;
}

export function withCanonicalApiHeaders(response: NextResponse): NextResponse {
  response.headers.set("x-shopreel-api-status", "canonical");
  return response;
}
