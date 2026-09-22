import { NextResponse } from "next/server";
import { clearCookieHeader } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", clearCookieHeader(request));
  return response;
}
