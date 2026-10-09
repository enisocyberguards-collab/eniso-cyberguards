import { NextRequest, NextResponse } from "next/server";
import { isValidSolvedToken, SOLVED_COOKIE_NAME } from "@/lib/challenge";
interface Payload { nom?: string; email?: string; telephone?: string; filiere?: string; pourquoi?: string; motivation?: string; site_web?: string }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function POST(req: NextRequest) {
  let body: Payload; try { body = await req.json(); } catch { return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 }); }
  if (body.site_web?.trim()) return NextResponse.json({ ok: true });
  const values = [body.nom, body.email, body.telephone, body.filiere, body.pourquoi, body.motivation];
  if (values.some((value) => !value?.trim())) return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
  if (!emailPattern.test(body.email!)) return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  if (body.motivation!.trim().length < 20 || body.pourquoi!.trim().length < 15) return NextResponse.json({ error: "Réponses trop courtes." }, { status: 400 });
  if (!isValidSolvedToken(req.cookies.get(SOLVED_COOKIE_NAME)?.value)) return NextResponse.json({ error: "Résous le challenge avant d&apos;envoyer ta candidature." }, { status: 403 });
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL; if (!scriptUrl) return NextResponse.json({ error: "Configuration Google Sheets manquante." }, { status: 500 });
  try { const response = await fetch(scriptUrl, { method: "POST", headers: { "Content-Type": "application/json" }, redirect: "follow", body: JSON.stringify({ ...body, date: new Date().toISOString() }) }); if (!response.ok) return NextResponse.json({ error: "Impossible d&apos;enregistrer la candidature." }, { status: 502 }); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "Erreur réseau. Réessaie." }, { status: 502 }); }
}
