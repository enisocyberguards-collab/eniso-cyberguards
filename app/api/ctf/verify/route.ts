import { NextRequest, NextResponse } from "next/server";
import { createSolvedToken, SESSION_COOKIE_NAME, SOLVED_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_SECONDS, verifyFlag } from "@/lib/challenge";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { answer?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body.answer || typeof body.answer !== "string") return NextResponse.json({ error: "Flag manquant." }, { status: 400 });
  if (!verifyFlag(req.cookies.get(SESSION_COOKIE_NAME)?.value, body.answer)) return NextResponse.json({ ok: false, error: "Incorrect flag. Analyze the least significant bits and try again." });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SOLVED_COOKIE_NAME, createSolvedToken(), { httpOnly: true, secure: true, sameSite: "lax", maxAge: SESSION_COOKIE_MAX_AGE_SECONDS, path: "/" });
  return response;
}
