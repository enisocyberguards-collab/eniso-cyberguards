import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface ApplicationPayload {
  nom: string;
  email: string;
  filiere: string;
  motivation: string;
  // Honeypot anti-spam : doit toujours arriver vide
  site_web?: string;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: NextRequest) {
  let body: ApplicationPayload;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 }
    );
  }

  const { nom, email, filiere, motivation, site_web } = body;

  // Honeypot : si rempli, c'est un bot. On répond succès pour ne pas l'alerter,
  // mais on n'écrit rien dans la feuille.
  if (site_web && site_web.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  if (!nom?.trim() || !email?.trim() || !filiere?.trim() || !motivation?.trim()) {
    return NextResponse.json(
      { error: "Tous les champs sont requis." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Adresse email invalide." },
      { status: 400 }
    );
  }

  if (motivation.trim().length < 20) {
    return NextResponse.json(
      { error: "La motivation doit contenir au moins 20 caractères." },
      { status: 400 }
    );
  }

  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

  if (!scriptUrl) {
    console.error("GOOGLE_SCRIPT_URL n'est pas défini dans les variables d'environnement.");
    return NextResponse.json(
      { error: "Configuration serveur manquante. Contacte un administrateur du club." },
      { status: 500 }
    );
  }

  try {
    const sheetResponse = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: nom.trim(),
        email: email.trim(),
        filiere: filiere.trim(),
        motivation: motivation.trim(),
        date: new Date().toISOString(),
      }),
      // Apps Script fait parfois une redirection 302 lors du POST : on la suit.
      redirect: "follow",
    });

    if (!sheetResponse.ok) {
      const text = await sheetResponse.text().catch(() => "");
      console.error("Échec de l'écriture Google Sheets:", sheetResponse.status, text);
      return NextResponse.json(
        { error: "Impossible d'enregistrer la candidature. Réessaie dans un instant." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erreur réseau vers Google Sheets:", err);
    return NextResponse.json(
      { error: "Erreur réseau. Réessaie dans un instant." },
      { status: 502 }
    );
  }
}
