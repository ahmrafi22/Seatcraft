import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { encodeSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/session";
import type { Session } from "@/lib/api/types";

export interface RegisterState {
  status: "idle" | "error";
  message?: string;
}

/**
 * Creates a tenant and its first admin, then signs in with the returned token.
 *
 * Runs as a route handler rather than a server action: Next only allows cookie
 * writes inside actions and handlers, and a handler gives us a real redirect
 * that preserves the session the API just issued.
 */
export async function POST(request: Request) {
  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return NextResponse.redirect(new URL("/signup?error=invalid", request.url), 303);
  }

  const tenantName = String(form.get("tenantName") ?? "").trim();
  const tenantSlug = String(form.get("tenantSlug") ?? "").trim().toLowerCase();
  const displayName = String(form.get("displayName") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");

  const fail = (code: string) => NextResponse.redirect(new URL(`/signup?error=${code}`, request.url), 303);

  if (!tenantName || !tenantSlug || !displayName || !email || !password) return fail("missing");
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(tenantSlug)) return fail("slug");
  if (password.length < 8) return fail("password");

  let session: Session;

  try {
    session = await api<Session>("/auth/register", {
      method: "POST",
      anonymous: true,
      body: { tenantName, tenantSlug, email, password, displayName }
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) return fail("taken");
    return fail("failed");
  }

  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(SESSION_COOKIE, encodeSession(session), sessionCookieOptions());

  revalidatePath("/", "layout");
  return response;
}
