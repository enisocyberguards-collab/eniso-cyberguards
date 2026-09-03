import { NextResponse } from "next/server";
import {
  generateChallengeSet,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/challenge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { flagHex, hiddenKey } = generateChallengeSet();

  // On régénère un flagPlain identique à partir du hex pour créer le token
  // (évite de garder deux sources de vérité) — on redécode simplement.
  const flagPlain = Buffer.from(flagHex, "hex").toString("utf-8");

  const response = NextResponse.json({ flagHex, hiddenKey });
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(flagPlain, hiddenKey), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}
