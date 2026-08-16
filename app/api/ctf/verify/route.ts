import { NextRequest, NextResponse } from "next/server";
import {
  verifyAnswer,
  createSolvedToken,
  CTF_COOKIE_NAME,
  CTF_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/challenge";

export const runtime = "nodejs";

// Anti brute-force basique en mémoire (par instance serverless).
// Suffisant pour un CTF de recrutement, pas conçu pour tenir une charge élevée.
const attempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 15;
const WINDOW_MS = 10 * 60 * 1000;

function getClientKey(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  const key = getClientKey(req);
  const now = Date.now();
  const record = attempts.get(key);

  if (record && now - record.firstAttempt < WINDOW_MS) {
    if (record.count >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessaie plus tard." },
        { status: 429 }
      );
    }
    record.count += 1;
  } else {
    attempts.set(key, { count: 1, firstAttempt: now });
  }

  let body: { answer?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (!body.answer || typeof body.answer !== "string") {
    return NextResponse.json({ error: "Réponse manquante." }, { status: 400 });
  }

  const solved = verifyAnswer(body.answer);

  if (!solved) {
    return NextResponse.json({ ok: false, error: "Hash incorrect. Réessaie." }, { status: 200 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CTF_COOKIE_NAME, createSolvedToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: CTF_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}
