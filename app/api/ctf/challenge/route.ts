import { NextResponse } from "next/server";
import { createSessionToken, generateChallengeSet, SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_SECONDS } from "@/lib/challenge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const challenge = generateChallengeSet();
  const response = NextResponse.json({ imageDataUrl: challenge.imageDataUrl });
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(challenge.flagPlain), {
    httpOnly: true, secure: true, sameSite: "lax", maxAge: SESSION_COOKIE_MAX_AGE_SECONDS, path: "/",
  });
  return response;
}
