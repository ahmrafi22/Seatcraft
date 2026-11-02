"use server";

import { headers } from "next/headers";

import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { PublicSeat } from "@/lib/api/types";

export interface LookupState {
  status: "idle" | "found" | "missing" | "error";
  seat?: PublicSeat;
  message?: string;
}

/**
 * Behind a proxy (nginx, Vercel) the API only sees the web tier's address, so every
 * visitor would share one rate-limit bucket. Forward the real client address, but take
 * it from `x-real-ip` (a proxy overwrites that) or the *last* forwarded hop — the first
 * entry of `x-forwarded-for` is whatever the visitor sent and cannot be trusted.
 */
async function clientAddressHeader(): Promise<Record<string, string>> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const address = store.get("x-real-ip")?.trim() || forwarded;

  return address ? { "X-Forwarded-For": address } : {};
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
      { anonymous: true, headers: await clientAddressHeader() }
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
