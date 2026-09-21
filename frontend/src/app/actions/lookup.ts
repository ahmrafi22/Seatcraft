"use server";

import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { PublicSeat } from "@/lib/api/types";

export interface LookupState {
  status: "idle" | "found" | "missing" | "error";
  seat?: PublicSeat;
  message?: string;
}

/** Anonymous lookup — the tenant slug is explicit because there is no JWT. */
export async function lookupSeatAction(_prev: LookupState, formData: FormData): Promise<LookupState> {
  const tenant = String(formData.get("tenant") ?? "").trim().toLowerCase();
  const roll = String(formData.get("roll") ?? "").trim();
  const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();

  if (!tenant) return { status: "error", message: "Add your institute's lookup code." };
  if (!roll) return { status: "error", message: "Roll number is required." };
  if (!dateOfBirth) return { status: "error", message: "Date of birth is required." };

  try {
    const seat = await api<PublicSeat>(
      `/public/${encodeURIComponent(tenant)}/seat-lookup?roll=${encodeURIComponent(roll)}&dateOfBirth=${encodeURIComponent(dateOfBirth)}`,
      { anonymous: true }
    );

    return { status: "found", seat };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { status: "missing", message: "No seat matched that roll and date of birth." };
    }

    if (error instanceof ApiError && error.status === 429) {
      return { status: "error", message: "Too many lookups. Wait a minute and try again." };
    }

    return {
      status: "error",
      message: error instanceof ApiError ? error.detail : "The lookup service is unavailable."
    };
  }
}
