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
    return redirectTo("/signup?error=invalid");
  }

  const tenantName = String(form.get("tenantName") ?? "").trim();
  const tenantSlug = String(form.get("tenantSlug") ?? "").trim().toLowerCase();
  const displayName = String(form.get("displayName") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");

  if (!tenantName || !tenantSlug || !displayName || !email || !password) return redirectTo("/signup?error=missing");
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(tenantSlug)) return redirectTo("/signup?error=slug");
  if (password.length < 8) return redirectTo("/signup?error=password");

  let session: Session;

  try {
    session = await api<Session>("/auth/register", {
      method: "POST",
      anonymous: true,
      body: { tenantName, tenantSlug, email, password, displayName }
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) return redirectTo("/signup?error=taken");
    return redirectTo("/signup?error=failed");
  }

  const response = redirectTo("/dashboard");
  response.cookies.set(SESSION_COOKIE, encodeSession(session), sessionCookieOptions());

  revalidatePath("/", "layout");
  return response;
}

/**
 * Relative Location on purpose: behind nginx the request URL carries the
 * container's bind address (0.0.0.0:3000), so an absolute redirect would send
 * the browser to a host it cannot reach.
 */
function redirectTo(path: string): NextResponse {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}
