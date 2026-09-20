"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { encodeSession, SESSION_COOKIE } from "@/lib/session";
import type { Session } from "@/lib/api/types";

const DEMO = {
  email: process.env.SEATCRAFT_DEMO_EMAIL ?? "admin@demo.test",
  password: process.env.SEATCRAFT_DEMO_PASSWORD ?? "Passw0rd!123"
};

/**
 * One-click sign-in for the seeded demo tenant. Development only — the button is
 * not rendered in a production build, and the action refuses to run there too.
 */
export async function demoLoginAction(): Promise<void> {
  if (process.env.NODE_ENV === "production") redirect("/login");

  try {
    const session = await api<Session>("/auth/login", {
      method: "POST",
      anonymous: true,
      body: DEMO
    });

    const store = await cookies();

    store.set(SESSION_COOKIE, encodeSession(session), {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 8
    });
  } catch (error) {
    const reason = error instanceof ApiError ? error.status : 0;
    redirect(`/login?demo=${reason === 404 ? "no-tenant" : "failed"}`);
  }

  redirect("/");
}
