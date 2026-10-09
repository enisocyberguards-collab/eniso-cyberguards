import crypto from "crypto";
import { PNG } from "pngjs";

const FLAG_PREFIX = "ECCC{";
const FLAG_SUFFIX = "}";
const CHALLENGE_IMAGE_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-PzJlUu9doseSX5e3nfpHLjMOkVKjPz.png";
export const CHALLENGE_START_AT = new Date("2026-10-10T10:00:00+01:00").getTime();
export const CHALLENGE_END_AT = new Date("2026-10-12T10:00:00+01:00").getTime();

export function isChallengeWindowOpen(now = Date.now()) {
  return now >= CHALLENGE_START_AT && now < CHALLENGE_END_AT;
}

export interface ChallengeSet {
  flagPlain: string;
  imageDataUrl: string;
}

function randomSuffix() {
  return crypto.randomBytes(2).toString("hex").slice(0, 4);
}

const STEGO_KEY = Buffer.from("second-call");

function encodePayload(message: string) {
  const source = Buffer.from(message, "utf8");
  const obfuscated = Buffer.alloc(source.length);
  for (let i = 0; i < source.length; i += 1) {
    obfuscated[i] = source[i] ^ STEGO_KEY[i % STEGO_KEY.length];
  }
  return Buffer.from(obfuscated.toString("base64"), "utf8");
}

async function embedInPng(message: string) {
  const response = await fetch(CHALLENGE_IMAGE_URL, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load challenge image");
  const png = PNG.sync.read(Buffer.from(await response.arrayBuffer()));
  const bits = encodePayload(message);
  const payload = Buffer.concat([Buffer.from([bits.length >> 8, bits.length & 255]), bits]);
  let bitIndex = 0;
  for (const byte of payload) {
    for (let bit = 7; bit >= 0; bit -= 1) {
      const pixel = bitIndex++;
      const channel = (pixel << 2) + 2;
      png.data[channel] = (png.data[channel] & 0xfe) | ((byte >> bit) & 1);
    }
  }
  return `data:image/png;base64,${PNG.sync.write(png).toString("base64")}`;
}

export async function generateChallengeSet(): Promise<ChallengeSet> {
  const flagPlain = `${FLAG_PREFIX}${randomSuffix()}${FLAG_SUFFIX}`;
  return { flagPlain, imageDataUrl: await embedInPng(flagPlain) };
}

function getSecret() {
  return process.env.COOKIE_SECRET || "dev-only-fallback-secret-change-me";
}
function hmac(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}
function safeEqual(a: string, b: string) {
  return a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
export const SESSION_COOKIE_NAME = "eniso_ctf_session";
export const SOLVED_COOKIE_NAME = "eniso_ctf_solved";
export const SESSION_COOKIE_MAX_AGE_SECONDS = 30 * 60;

type SessionPayload = { flagHash: string; issuedAt: number };
export function createSessionToken(flagPlain: string) {
  const payload = Buffer.from(JSON.stringify({ flagHash: hmac(flagPlain), issuedAt: Date.now() })).toString("base64url");
  return `${payload}.${hmac(payload)}`;
}
function readSessionToken(token?: string): SessionPayload | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, hmac(payload))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionPayload;
    const age = Date.now() - parsed.issuedAt;
    return age >= 0 && age <= SESSION_COOKIE_MAX_AGE_SECONDS * 1000 ? parsed : null;
  } catch { return null; }
}
export function verifyFlag(token: string | undefined, answer: string) {
  const session = readSessionToken(token);
  return Boolean(session && safeEqual(session.flagHash, hmac(answer.trim())));
}
export function createSolvedToken() {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${hmac(issuedAt)}`;
}
export function isValidSolvedToken(token?: string) {
  if (!token) return false;
  const [issuedAt, signature] = token.split(".");
  return Boolean(issuedAt && signature && safeEqual(signature, hmac(issuedAt)) && Date.now() - Number(issuedAt) <= SESSION_COOKIE_MAX_AGE_SECONDS * 1000);
}
export function expectedFlagPattern() { return /^ECCC\{[a-f0-9]{4}\}$/; }
