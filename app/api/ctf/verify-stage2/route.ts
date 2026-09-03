import { NextRequest, NextResponse } from "next/server";
import {
  verifyStage2,
  createSolvedToken,
  SESSION_COOKIE_NAME,
  SOLVED_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/challenge";

export const runtime = "nodejs";

const attempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 20;
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
      return NextResponse.json({ error: "Trop de tentatives. Réessaie plus tard." }, { status: 429 });
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
    return NextResponse.json({ ok: false, error: "Réponse manquante." }, { status: 200 });
  }

  const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const result = verifyStage2(sessionToken, body.answer);

  if (!result.ok) {
    const messages: Record<string, string> = {
      no_session: "Session expirée, recharge la page.",
      stage1_required: "Résous d'abord le premier challenge.",
      wrong_answer: "Clé incorrecte. Regarde bien dans l'inspecteur (F12).",
    };
    return NextResponse.json({ ok: false, error: messages[result.reason] }, { status: 200 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SOLVED_COOKIE_NAME, createSolvedToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}
