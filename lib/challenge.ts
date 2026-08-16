import crypto from "crypto";

/**
 * Phrase secrète du challenge, propre à ENISo CyberGuards.
 * Change-la régulièrement (ex: avant chaque campagne de recrutement)
 * pour que le challenge reste inédit et non réutilisable d'une année à l'autre.
 */
const SECRET_PHRASE = "gr4b_th3_fl4g_eniso_cyberguards_2026";

/** Encodage hexadécimal affiché au candidat sur le terminal. */
export function getEncodedChallenge(): string {
  return Buffer.from(SECRET_PHRASE, "utf-8").toString("hex");
}

/** Hash SHA-256 attendu (calculé une seule fois, comparé en temps constant). */
function getExpectedHash(): string {
  return crypto.createHash("sha256").update(SECRET_PHRASE, "utf-8").digest("hex");
}

export function verifyAnswer(submittedHash: string): boolean {
  const expected = getExpectedHash();
  const normalized = submittedHash.trim().toLowerCase();

  if (normalized.length !== expected.length) return false;

  // Comparaison en temps constant pour éviter le timing attack (bonne pratique cyber,
  // cohérente avec l'esprit du club, même si l'enjeu ici est purement pédagogique).
  return crypto.timingSafeEqual(Buffer.from(normalized), Buffer.from(expected));
}

export const CTF_COOKIE_NAME = "eniso_ctf_solved";
export const CTF_COOKIE_MAX_AGE_SECONDS = 30 * 60; // 30 minutes pour aller jusqu'au formulaire

function getCookieSecret(): string {
  // À définir en prod via la variable d'environnement Vercel COOKIE_SECRET.
  // Une valeur de repli existe pour que le dev local fonctionne sans configuration.
  return process.env.COOKIE_SECRET || "dev-only-fallback-secret-change-me";
}

/**
 * Jeton signé (timestamp + HMAC) posé dans le cookie après résolution du challenge.
 * Empêche un candidat de simplement créer manuellement un cookie "eniso_ctf_solved=1"
 * pour sauter l'étape du challenge.
 */
export function createSolvedToken(): string {
  const issuedAt = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", getCookieSecret())
    .update(issuedAt)
    .digest("hex");
  return `${issuedAt}.${signature}`;
}

export function isValidSolvedToken(token: string | undefined): boolean {
  if (!token) return false;
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", getCookieSecret())
    .update(issuedAt)
    .digest("hex");

  if (signature.length !== expectedSignature.length) return false;
  const validSignature = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
  if (!validSignature) return false;

  const age = Date.now() - Number(issuedAt);
  return age >= 0 && age <= CTF_COOKIE_MAX_AGE_SECONDS * 1000;
}
