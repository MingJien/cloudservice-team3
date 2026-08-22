import type { ProblemDetails } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";

export interface SessionUser {
  id: number;
  userName: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export async function login(userNameOrEmail: string, password: string) {
  return request<{ user: SessionUser }>("/api/session/login", {
    method: "POST",
    body: JSON.stringify({ userNameOrEmail, password }),
  });
}

export function currentSession() {
  return request<{ user: SessionUser }>("/api/session/current");
}

export function updateProfile(fullName: string, email: string) {
  return request<{ user: SessionUser }>("/api/admin/profile", {
    method: "PUT",
    body: JSON.stringify({ fullName, email }),
  });
}

export function logout() {
  return request<void>("/api/session/logout", { method: "DELETE" });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return request<void>("/api/session/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body) headers.set("Content-Type", "application/json");
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({})) as ProblemDetails;
    throw new ApiError(response.status, problem);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
