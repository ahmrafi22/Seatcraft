"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { DEMO_CREDENTIALS, isDemoLoginEnabled } from "@/lib/demo";
import { encodeSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/session";
import type { Session } from "@/lib/api/types";

/**
 * One-click sign-in for the seeded demo tenant. Gated by `isDemoLoginEnabled`,
 * so it is reachable in a production build only when explicitly opted in.
 */
export async function demoLoginAction(): Promise<void> {
  if (!isDemoLoginEnabled()) redirect("/login");

  try {
    const session = await api<Session>("/auth/login", {
      method: "POST",
      anonymous: true,
      body: DEMO_CREDENTIALS
    });

    const store = await cookies();
    store.set(SESSION_COOKIE, encodeSession(session), sessionCookieOptions());
  } catch (error) {
    const reason = error instanceof ApiError ? error.status : 0;
    redirect(`/login?demo=${reason === 404 ? "no-tenant" : "failed"}`);
  }

  redirect("/");
}
