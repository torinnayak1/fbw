import { NextResponse } from "next/server";
import { authenticate, cookieHeader, signSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    userId?: string;
    password?: string;
  } | null;
  const userId = body?.userId?.trim() ?? "";
  const password = body?.password ?? "";
  const session = authenticate(userId, password);
  if (!session) {
    return NextResponse.json({ error: "Wrong password for that player." }, { status: 401 });
  }
  const response = NextResponse.json({ session });
  response.headers.set("Set-Cookie", cookieHeader(signSession(session), request));
  return response;
}
