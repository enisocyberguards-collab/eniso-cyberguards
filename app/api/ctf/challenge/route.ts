import { NextResponse } from "next/server";
import { getEncodedChallenge } from "@/lib/challenge";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ encoded: getEncodedChallenge() });
}
