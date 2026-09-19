import { cookies } from "next/headers";
import type { Session } from "@/lib/api/types";

export const SESSION_COOKIE = "seatcraft_session";
export const TENANT_COOKIE = "seatcraft_tenant";

/**
 * The session lives in a cookie, so it is base64url-encoded JSON: no quotes,
 * braces or slashes to trip over cookie parsing.
 */
export function encodeSession(session: Session): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function decodeSession(raw: string): Session | null {
  try {
    const session = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Session;

    // Treat an expired token as signed out so the UI redirects before a 401 round-trip.
    if (!session.accessToken || new Date(session.expiresAt).getTime() <= Date.now()) return null;

    return session;
  } catch {
    return null;
  }
}

/** Server-side session read. The token is httpOnly, so browser JS never sees it. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;

  return raw ? decodeSession(raw) : null;
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.accessToken ?? null;
}
