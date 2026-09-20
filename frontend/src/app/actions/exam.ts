"use server";

import { revalidatePath } from "next/cache";

import { api, apiBlob } from "@/lib/api/client";
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

export async function downloadDocumentAction(
  examId: string,
  planId: string,
  kind: "admit-cards" | "attendance-sheets"
): Promise<{ ok: boolean; base64?: string; filename?: string; message?: string }> {
  await requireSession();

  try {
    const { blob, filename } = await apiBlob(`/exams/${examId}/seat-plans/${planId}/documents/${kind}`);
    const buffer = Buffer.from(await blob.arrayBuffer());

    return { ok: true, base64: buffer.toString("base64"), filename };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not build the documents." };
  }
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}
