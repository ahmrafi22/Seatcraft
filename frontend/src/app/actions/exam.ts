"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { requireAdmin, requireSession } from "@/lib/auth-guard";
import type { AllocationRun, Exam, Institution, SeatPlanDetail, SeatPlan, SeedResult, Strategy } from "@/lib/api/types";
import { FEMALE_NAMES, MALE_NAMES, SUBJECT_GROUPS } from "@/lib/bd-data";
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

    revalidatePath("/dashboard");
    revalidatePath("/exams");
    return { ok: true, message: `Seeded ${result.candidates} candidates into ${result.halls} halls.` };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { ok: false, message: "Demo seeding only runs in the Development environment." };
    }

    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not seed demo data." };
  }
}

export interface CreateExamWizardResult {
  ok: boolean;
  message?: string;
  examId?: string;
}

/**
 * Creates an exam and its starter data in one submit.
 *
 * Halls and colleges are cheap API calls, but candidates are not: creating 500
 * of them one request at a time would take seconds. They are built into a CSV
 * in memory and pushed through the same import endpoint the UI exposes, so the
 * wizard and a manual upload exercise one code path.
 */
export async function createExamWithDataAction(
  _prev: CreateExamWizardResult | null,
  formData: FormData
): Promise<CreateExamWizardResult> {
  await requireSession();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const examDate = String(formData.get("examDate") ?? "").trim();
  const hallCount = clamp(Number(formData.get("hallCount") ?? 0), 0, 50);
  const rows = clamp(Number(formData.get("rows") ?? 10), 1, 100);
  const columns = clamp(Number(formData.get("columns") ?? 10), 1, 100);
  const candidateCount = clamp(Number(formData.get("candidateCount") ?? 0), 0, 5000);
  const collegeIds = formData.getAll("collegeIds").map(String).filter(Boolean);

  if (!title) return { ok: false, message: "Give the exam a title." };
  if (candidateCount > 0 && collegeIds.length === 0) {
    return { ok: false, message: "Pick at least one college for the candidates." };
  }

  try {
    const exam = await api<Exam>("/exams", {
      method: "POST",
      body: { title, description: description || null }
    });

    // The API takes the date on update, so set it right after creating.
    if (examDate) {
      await api(`/exams/${exam.id}`, {
        method: "PUT",
        body: { title, description: description || null, examDate }
      });
    }

    const notes: string[] = [];

    for (let index = 1; index <= hallCount; index += 1) {
      await api(`/exams/${exam.id}/halls`, {
        method: "POST",
        body: { name: `Hall ${String(index).padStart(2, "0")}`, rows, columns }
      });
    }

    if (hallCount > 0) notes.push(`${hallCount} hall${hallCount === 1 ? "" : "s"}`);

    if (candidateCount > 0) {
      // The importer matches on institution code, so resolve the picked ids.
      const all = await api<Institution[]>("/institutions").catch(() => [] as Institution[]);
      const codes = collegeIds
        .map((id) => all.find((institution) => institution.id === id)?.code)
        .filter((code): code is string => Boolean(code));

      if (codes.length === 0) {
        revalidatePath("/exams");
        return {
          ok: false,
          examId: exam.id,
          message: `Created "${exam.title}", but the selected colleges could not be resolved. Add candidates manually.`
        };
      }

      const csv = buildCandidateCsv(candidateCount, codes);

      const body = new FormData();
      body.append("file", new File([csv], "candidates.csv", { type: "text/csv" }));

      const imported = await api<{ imported: number; skipped: number }>(
        `/exams/${exam.id}/candidates/import`,
        { method: "POST", body }
      );

      notes.push(`${imported.imported} candidate${imported.imported === 1 ? "" : "s"}`);
      if (imported.skipped > 0) notes.push(`${imported.skipped} skipped`);
    }

    revalidatePath("/dashboard");
    revalidatePath("/exams");
    revalidatePath(`/exams/${exam.id}`);

    return {
      ok: true,
      examId: exam.id,
      message: notes.length > 0 ? `Created "${exam.title}" with ${notes.join(", ")}.` : `Created "${exam.title}".`
    };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not create the exam." };
  }
}

/**
 * Builds the CSV the import endpoint expects, cycling the chosen colleges so the
 * spread looks realistic. Codes (not ids) are what the importer matches on.
 *
 * Names come from the shared Bangladeshi sample list so a generated roster reads
 * like a real one. Names repeat once the pools are exhausted, but rolls stay
 * unique — the importer keys on roll, not name.
 */
function buildCandidateCsv(count: number, codes: string[]): string {
  const lines = ["roll,name,institutionCode,subjectGroup,dateOfBirth"];

  for (let index = 0; index < count; index += 1) {
    const roll = `R${String(index + 1).padStart(5, "0")}`;
    // Alternate the pools so the roster is not one gender in a block.
    const pool = index % 2 === 0 ? MALE_NAMES : FEMALE_NAMES;
    const name = pool[Math.floor(index / 2) % pool.length] ?? "Candidate";
    const group = SUBJECT_GROUPS[index % SUBJECT_GROUPS.length] ?? "Science";
    const dob = `2000-${String((index % 12) + 1).padStart(2, "0")}-${String((index % 28) + 1).padStart(2, "0")}`;
    const code = codes[index % codes.length] ?? "";

    lines.push(`${roll},${name},${code},${group},${dob}`);  }

  return lines.join("\n");
}

/** Deletes an exam and everything under it. Admin-only, and irreversible. */
export async function deleteExamAction(examId: string): Promise<ActionResult> {
  await requireAdmin();

  try {
    await api(`/exams/${examId}`, { method: "DELETE" });

    revalidatePath("/dashboard");
    revalidatePath("/exams");
    return { ok: true, message: "Exam deleted." };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not delete the exam." };
  }
}

/** Adds one hall to an exam. Grid size is what decides how many seats it offers. */
export async function createHallAction(examId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireSession();

  const name = String(formData.get("name") ?? "").trim();
  const rows = clamp(Number(formData.get("rows") ?? 10), 1, 100);
  const columns = clamp(Number(formData.get("columns") ?? 10), 1, 100);

  if (!name) return { ok: false, message: "Give the hall a name." };

  try {
    await api(`/exams/${examId}/halls`, { method: "POST", body: { name, rows, columns } });

    revalidatePath(`/exams/${examId}`);
    revalidatePath("/dashboard");
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

    revalidatePath("/colleges");
    revalidatePath("/exams");
    return { ok: true, message: `Added ${name}.` };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not add the college." };
  }
}

export async function updateInstitutionAction(
  institutionId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireSession();

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();

  if (!name || !code) return { ok: false, message: "Both the name and the code are required." };

  try {
    await api(`/institutions/${institutionId}`, { method: "PUT", body: { name, code } });

    revalidatePath("/colleges");
    revalidatePath("/exams");
    return { ok: true, message: `Saved ${name}.` };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not save the college." };
  }
}

export async function deleteInstitutionAction(institutionId: string): Promise<ActionResult> {
  await requireSession();

  try {
    await api(`/institutions/${institutionId}`, { method: "DELETE" });

    revalidatePath("/colleges");
    revalidatePath("/exams");
    return { ok: true, message: "College deleted." };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.detail : "Could not delete the college." };
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
    revalidatePath("/dashboard");
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
    revalidatePath("/dashboard");

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
    revalidatePath("/dashboard");
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
