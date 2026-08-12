"use client";

import { getToken } from "@/lib/auth";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function isApiUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

type ApiOptions = {
  method?: string;
  body?: unknown;
  formData?: FormData;
  auth?: boolean;
};

export async function apiRequest<T = any>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = "GET", body, formData, auth = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined && !formData) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (!token) throw new ApiError(401, "Not authenticated");
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, "Network error. Please check your connection.");
  }

  if (!res.ok) {
    let detail: unknown = "Request failed";
    try {
      const data = await res.json();
      if (data?.detail !== undefined) detail = data.detail;
    } catch {
      /* non-JSON error body */
    }
    const message = Array.isArray(detail)
      ? String(detail[0]?.msg ?? detail[0] ?? "Request failed")
      : String(detail ?? "Request failed");
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}