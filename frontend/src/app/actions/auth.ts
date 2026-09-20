"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth-guard";
import { encodeSession, SESSION_COOKIE } from "@/lib/session";
import type { Exam, Session } from "@/lib/api/types";

export interface ActionResult {
  ok: boolean;
  message?: string;
}

export interface ExamConstraintsInput {
  preventSameInstitutionAdjacent: boolean;
  keepSubjectGroupContiguous: boolean;
  maintainRollOrder: boolean;
  allowHallSkipping: boolean;
}

const MAX_AGE = 60 * 60 * 8;

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { ok: false, message: "Email and password are required." };

  try {
    const session = await api<Session>("/auth/login", {
      method: "POST",
      anonymous: true,
      body: { email, password }
    });

    const store = await cookies();

    store.set(SESSION_COOKIE, encodeSession(session), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: MAX_AGE
    });
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not reach the API." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);

  revalidatePath("/", "layout");
  redirect("/login");
}

/** Persists one constraint flag. Re-reads the exam so a stale client cannot wipe the others. */
export async function setExamConstraintAction(
  examId: string,
  key: keyof ExamConstraintsInput,
  value: boolean
): Promise<ActionResult> {
  await requireSession();

  try {
    const exam = await api<Exam>(`/exams/${examId}`);
    const next = { ...exam.constraints, [key]: value };

    await api(`/exams/${examId}/constraints`, { method: "PUT", body: next });

    revalidatePath(`/exams/${examId}`);
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not save the rule." };
  }
}
