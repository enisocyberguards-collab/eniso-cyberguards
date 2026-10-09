import { NextResponse } from "next/server";
import { createSessionToken, generateChallengeSet, isChallengeWindowOpen, SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_SECONDS } from "@/lib/challenge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isChallengeWindowOpen()) return NextResponse.json({ error: "The challenge window is closed." }, { status: 403 });
  const challenge = await generateChallengeSet();
  const response = NextResponse.json({ imageDataUrl: challenge.imageDataUrl, encodedClue: challenge.encodedClue });
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(challenge.flagPlain), {
    httpOnly: true, secure: true, sameSite: "lax", maxAge: SESSION_COOKIE_MAX_AGE_SECONDS, path: "/",
  });
  return response;
}
