"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { requireAdmin, requireSession } from "@/lib/auth-guard";
import type { AllocationRun, Exam, SeatPlanDetail, SeatPlan, SeedResult, Strategy } from "@/lib/api/types";
import type { ActionResult } from "@/app/actions/auth";

/** Every action re-checks the session: Server Functions are reachable by direct POST. */
async function guarded<T>(run: () => Promise<T>, fallback: string): Promise<T | { ok: false; message: string }> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, message: error.detail };
    return { ok: false, message: fallback };
  }
}

export async function createExamAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireSession();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) return { ok: false, message: "Give the exam a title." };
  if (title.length > 160) return { ok: false, message: "Keep the title under 160 characters." };

  try {
    const exam = await api<Exam>("/exams", {
      method: "POST",
      body: { title, description: description || null }
    });

    revalidatePath("/");
    revalidatePath("/exams");
    return { ok: true, message: `Created "${exam.title}".` };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not create the exam." };
  }
}

export async function seedDemoAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const candidates = clamp(Number(formData.get("candidates") ?? 500), 1, 5000);
  const institutions = clamp(Number(formData.get("institutions") ?? 20), 1, 100);
  const halls = clamp(Number(formData.get("halls") ?? 12), 1, 50);

  try {
    const result = await api<SeedResult>(
      `/dev/seed-demo?candidates=${candidates}&institutions=${institutions}&halls=${halls}`,
      { method: "POST" }
    );

    revalidatePath("/");
    revalidatePath("/exams");
    return { ok: true, message: `Seeded ${result.candidates} candidates into ${result.halls} halls.` };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { ok: false, message: "Demo seeding only runs in the Development environment." };
    }

    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not seed demo data." };
  }
}

/** Deletes an exam and everything under it. Admin-only, and irreversible. */
export async function deleteExamAction(examId: string): Promise<ActionResult> {
  await requireAdmin();

  try {
    await api(`/exams/${examId}`, { method: "DELETE" });

    revalidatePath("/");
    revalidatePath("/exams");
    return { ok: true, message: "Exam deleted." };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not delete the exam." };
  }
}

/** Adds one hall to an exam. Grid size is what decides how many seats it offers. */export async function createHallAction(examId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireSession();

  const name = String(formData.get("name") ?? "").trim();
  const rows = clamp(Number(formData.get("rows") ?? 10), 1, 100);
  const columns = clamp(Number(formData.get("columns") ?? 10), 1, 100);

  if (!name) return { ok: false, message: "Give the hall a name." };

  try {
    await api(`/exams/${examId}/halls`, { method: "POST", body: { name, rows, columns } });

    revalidatePath(`/exams/${examId}`);
    revalidatePath("/");
    return { ok: true, message: `Added ${name} (${rows} × ${columns}).` };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not add the hall." };
  }
}

/** Colleges are tenant-wide, not per exam, so this does not take an exam id. */
export async function createInstitutionAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireSession();

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();

  if (!name || !code) return { ok: false, message: "Both the name and the code are required." };

  try {
    await api("/institutions", { method: "POST", body: { name, code } });

    revalidatePath("/exams");
    return { ok: true, message: `Added ${name}.` };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not add the college." };
  }
}

export async function createCandidateAction(
  examId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireSession();

  const roll = String(formData.get("roll") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const subjectGroup = String(formData.get("subjectGroup") ?? "").trim() || "General";
  const institutionId = String(formData.get("institutionId") ?? "");

  if (!roll || !fullName) return { ok: false, message: "Roll and name are required." };
  if (!institutionId) return { ok: false, message: "Pick a college for this candidate." };

  try {
    await api(`/exams/${examId}/candidates`, {
      method: "POST",
      body: { roll, fullName, subjectGroup, institutionId }
    });

    revalidatePath(`/exams/${examId}`);
    revalidatePath("/");
    return { ok: true, message: `Added ${roll}.` };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not add the candidate." };
  }
}

/** CSV upload: roll, name, institutionCode required; subjectGroup and dateOfBirth optional. */
export async function importCandidatesAction(
  examId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireSession();

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a CSV file to import." };

  try {
    const body = new FormData();
    body.append("file", file);

    const result = await api<{ imported: number; skipped: number; errors: { line: number; message: string }[] }>(
      `/exams/${examId}/candidates/import`,
      { method: "POST", body }
    );

    revalidatePath(`/exams/${examId}`);
    revalidatePath("/");

    if (result.skipped > 0) {
      const first = result.errors[0];
      return {
        ok: result.imported > 0,
        message: `Imported ${result.imported}, skipped ${result.skipped}.${first ? ` Line ${first.line}: ${first.message}` : ""}`
      };
    }

    return { ok: true, message: `Imported ${result.imported} candidates.` };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not import the file." };
  }
}

export async function startAllocationAction(
  examId: string,
  strategy: Strategy,
  seed?: number
): Promise<{ ok: boolean; runId?: string; message?: string }> {
  await requireSession();

  try {
    const run = await api<AllocationRun>(`/exams/${examId}/allocation-runs`, {
      method: "POST",
      body: { strategy, seed: seed ?? null, timeLimitSeconds: null },
      headers: { "Idempotency-Key": crypto.randomUUID() }
    });

    revalidatePath(`/exams/${examId}`);
    return { ok: true, runId: run.id };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not start the run." };
  }
}

export async function cancelRunAction(examId: string, runId: string): Promise<ActionResult> {
  await requireSession();

  try {
    await api(`/exams/${examId}/allocation-runs/${runId}`, { method: "DELETE" });
    revalidatePath(`/exams/${examId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not cancel the run." };
  }
}

export async function publishPlanAction(examId: string, planId: string): Promise<ActionResult> {
  await requireAdmin();

  try {
    await api<SeatPlan>(`/exams/${examId}/seat-plans/${planId}/publish`, { method: "POST" });
    revalidatePath(`/exams/${examId}`);
    revalidatePath(`/exams/${examId}/plan`);
    revalidatePath("/");
    return { ok: true, message: "Plan published. Candidates can now look up their seats." };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not publish the plan." };
  }
}

export async function swapSeatsAction(
  examId: string,
  planId: string,
  firstCandidateId: string,
  secondCandidateId: string,
  force = false,
  reason?: string
): Promise<ActionResult> {
  await requireSession();

  try {
    const query = new URLSearchParams();

    if (force) query.set("force", "true");
    if (reason) query.set("reason", reason);

    const suffix = query.size ? `?${query.toString()}` : "";

    await api(`/exams/${examId}/seat-plans/${planId}/swap${suffix}`, {
      method: "POST",
      body: { firstCandidateId, secondCandidateId }
    });

    revalidatePath(`/exams/${examId}/plan`);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not swap the seats." };
  }
}

export async function moveCandidateAction(
  examId: string,
  planId: string,
  candidateId: string,
  hallId: string,
  row: number,
  column: number,
  force = false,
  reason?: string
): Promise<ActionResult> {
  await requireSession();

  try {
    const query = new URLSearchParams();

    if (force) query.set("force", "true");

    const suffix = query.size ? `?${query.toString()}` : "";

    await api(`/exams/${examId}/seat-plans/${planId}/move${suffix}`, {
      method: "POST",
      body: { candidateId, hallId, row, column, reason: reason ?? "Moved by an operator in the planner." }
    });

    revalidatePath(`/exams/${examId}/plan`);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not move the candidate." };
  }
}

export async function fetchPlanAction(examId: string, planId: string): Promise<SeatPlanDetail | null> {
  await requireSession();

  const result = await guarded(() => api<SeatPlanDetail>(`/exams/${examId}/seat-plans/${planId}`), "Could not load the plan.");
  return "ok" in result ? null : result;
}

/**
 * Documents are streamed by the API, not buffered here: the backend returns a signed
 * ten-minute URL and the browser fetches it directly. Keeps a 20 MB+ archive out of
 * the web tier entirely.
 */
export async function downloadDocumentAction(
  examId: string,
  planId: string,
  kind: "admit-cards" | "attendance-sheets"
): Promise<{ ok: boolean; url?: string; message?: string }> {
  await requireSession();

  try {
    const link = await api<{ url: string; expiresAt: string }>(
      `/exams/${examId}/seat-plans/${planId}/documents/${kind}/link`,
      { method: "POST" }
    );

    return { ok: true, url: `${process.env.SEATCRAFT_PUBLIC_API_ORIGIN ?? ""}${link.url}` };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not build the documents." };
  }
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}
