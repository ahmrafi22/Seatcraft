import "server-only";

import { ApiError, type ProblemDetails } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/session";

const ORIGIN = process.env.SEATCRAFT_API_ORIGIN ?? "http://localhost:5199";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Send without a bearer token — login, register and the public lookup. */
  anonymous?: boolean;
  headers?: Record<string, string>;
  /** Next.js fetch cache policy. Mutations always bypass it. */
  cache?: RequestCache;
  revalidate?: number;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const token = options.anonymous ? null : await getAccessToken();

  const headers: Record<string, string> = { Accept: "application/json", ...options.headers };

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${ORIGIN}/api${path}`, {
    method,
    headers,
    body:
      options.body === undefined
        ? undefined
        : options.body instanceof FormData
          ? options.body
          : JSON.stringify(options.body),
    cache: options.cache ?? (method === "GET" ? "no-store" : "no-store"),
    ...(options.revalidate === undefined ? {} : { next: { revalidate: options.revalidate } })
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload = text ? safeJson(text) : null;

  if (!response.ok) {
    const problem = (payload as ProblemDetails | null) ?? null;
    throw new ApiError(
      response.status,
      problem?.title ?? `Request failed with status ${response.status}.`,
      problem
    );
  }

  return payload as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { title: text.slice(0, 300) };
  }
}
