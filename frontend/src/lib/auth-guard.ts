import "server-only";

import { getSession } from "@/lib/session";
import type { Session } from "@/lib/api/types";

/**
 * Server Functions are reachable by direct POST, not only through our UI, so every
 * action re-checks the session here instead of trusting the caller.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();

  if (session.user.role !== "Admin") throw new Error("Forbidden");

  return session;
}
