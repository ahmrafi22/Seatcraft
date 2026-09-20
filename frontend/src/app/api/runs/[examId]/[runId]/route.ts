import { NextResponse } from "next/server";

import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { AllocationRun } from "@/lib/api/types";

/**
 * Polling endpoint for the allocation progress bar. The browser never sees the
 * bearer token — this handler attaches it server-side.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ examId: string; runId: string }> }
) {
  const { examId, runId } = await params;

  try {
    const run = await api<AllocationRun>(`/exams/${examId}/allocation-runs/${runId}`);
    return NextResponse.json(run);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    return NextResponse.json({ message: "Could not read the run." }, { status });
  }
}
