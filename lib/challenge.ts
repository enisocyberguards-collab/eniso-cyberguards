import crypto from "crypto";

/**
 * ENISo CyberGuards — logique des 2 challenges d'accès.
 *
 * CTF 1 : une variante "leetspeak" du flag, générée aléatoirement à chaque
 *         nouvelle session (donc jamais identique d'un candidat à l'autre),
 *         encodée en hex. Le candidat décode et colle le texte lisible obtenu.
 * CTF 2 : un court code (ex: ENISO-K7X2Q9), généré aléatoirement, caché dans
 *         un commentaire HTML visible via l'inspecteur du navigateur (F12).
 *
 * Les réponses attendues ne sont jamais envoyées en clair au client : seul un
 * hash (HMAC) circule dans un cookie signé, vérifié côté serveur.
 */

const FLAG_PREFIX = "EnisoCyberGuards{";
const FLAG_SUFFIX = "}";
const BASE_MESSAGE = "You_will_be_called_for_an_interview";

// Table de substitution leetspeak — plusieurs choix possibles par lettre
// pour que le rendu varie d'une session à l'autre.
const LEET_MAP: Record<string, string[]> = {
  a: ["a", "4"],
  e: ["e", "3"],
  i: ["i", "1"],
  o: ["o", "0"],
  s: ["s", "5"],
  t: ["t", "7"],
};

function randomLeetVariant(message: string): string {
  return message
    .split("")
    .map((char) => {
      const lower = char.toLowerCase();
      const options = LEET_MAP[lower];
      if (!options) return char;
      // ~50% de chances de substituer, pour varier le rendu à chaque tirage
      if (Math.random() < 0.5) return options[1];
      return char;
    })
    .join("");
}

function randomHiddenKey(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans caractères ambigus
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[crypto.randomInt(alphabet.length)];
  }
  return `ENISO-${code}`;
}

export interface ChallengeSet {
  flagPlain: string; // ex: EnisoCyberGuards{Y0u_w1ll_be_c4lled_for_4n_1nterview}
  flagHex: string; // version hex affichée au candidat
  hiddenKey: string; // ex: ENISO-K7X2Q9
}

export function generateChallengeSet(): ChallengeSet {
  const flagPlain = FLAG_PREFIX + randomLeetVariant(BASE_MESSAGE) + FLAG_SUFFIX;
  const flagHex = Buffer.from(flagPlain, "utf-8").toString("hex");
  const hiddenKey = randomHiddenKey();
  return { flagPlain, flagHex, hiddenKey };
}

function getSecret(): string {
  return process.env.COOKIE_SECRET || "dev-only-fallback-secret-change-me";
}

function hmac(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value, "utf-8").digest("hex");
}

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export const SESSION_COOKIE_NAME = "eniso_ctf_session";
export const SOLVED_COOKIE_NAME = "eniso_ctf_solved";
const SESSION_MAX_AGE_SECONDS = 30 * 60; // 30 minutes pour résoudre les 2 CTF

interface SessionPayload {
  flagHash: string;
  keyHash: string;
  stage1: boolean; // CTF 1 déjà résolu ?
  issuedAt: number;
}

/** Crée le cookie de session signé contenant les hashs des 2 réponses attendues. */
export function createSessionToken(flagPlain: string, hiddenKey: string): string {
  const payload: SessionPayload = {
    flagHash: hmac(flagPlain),
    keyHash: hmac(hiddenKey),
    stage1: false,
    issuedAt: Date.now(),
  };
  return signPayload(payload);
}

function signPayload(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json, "utf-8").toString("base64url");
  const signature = hmac(encoded);
  return `${encoded}.${signature}`;
}

function readSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expectedSignature = hmac(encoded);
  if (!timingSafeStringEqual(signature, expectedSignature)) return null;

  try {
    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    const payload = JSON.parse(json) as SessionPayload;
    const age = Date.now() - payload.issuedAt;
    if (age < 0 || age > SESSION_MAX_AGE_SECONDS * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Vérifie la réponse du CTF 1 (flag leetspeak). Renvoie le nouveau cookie de session si correct. */
export function verifyStage1(
  token: string | undefined,
  submittedAnswer: string
): { ok: true; newToken: string } | { ok: false } {
  const session = readSessionToken(token);
  if (!session) return { ok: false };

  const submittedHash = hmac(submittedAnswer.trim());
  if (!timingSafeStringEqual(submittedHash, session.flagHash)) return { ok: false };

  const updated: SessionPayload = { ...session, stage1: true };
  return { ok: true, newToken: signPayload(updated) };
}

/** Vérifie la réponse du CTF 2 (clé cachée). Le CTF 1 doit déjà être résolu. */
export function verifyStage2(
  token: string | undefined,
  submittedAnswer: string
): { ok: true } | { ok: false; reason: "no_session" | "stage1_required" | "wrong_answer" } {
  const session = readSessionToken(token);
  if (!session) return { ok: false, reason: "no_session" };
  if (!session.stage1) return { ok: false, reason: "stage1_required" };

  const submittedHash = hmac(submittedAnswer.trim().toUpperCase());
  if (!timingSafeStringEqual(submittedHash, session.keyHash)) {
    return { ok: false, reason: "wrong_answer" };
  }
  return { ok: true };
}

export function createSolvedToken(): string {
  const issuedAt = Date.now().toString();
  const signature = hmac(issuedAt);
  return `${issuedAt}.${signature}`;
}

export function isValidSolvedToken(token: string | undefined): boolean {
  if (!token) return false;
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;

  const expectedSignature = hmac(issuedAt);
  if (!timingSafeStringEqual(signature, expectedSignature)) return false;

  const age = Date.now() - Number(issuedAt);
  return age >= 0 && age <= SESSION_MAX_AGE_SECONDS * 1000;
}

export const SESSION_COOKIE_MAX_AGE_SECONDS = SESSION_MAX_AGE_SECONDS;
