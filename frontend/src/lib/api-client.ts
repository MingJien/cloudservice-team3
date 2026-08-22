export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly problem: ProblemDetails) {
    super(formatProblem(problem, status));
    this.name = "ApiError";
  }
}

function formatProblem(problem: ProblemDetails, status: number): string {
  const validationMessages = Object.values(problem.errors ?? {})
    .flat()
    .map((message) => message.trim())
    .filter(Boolean);
  if (validationMessages.length > 0) return [...new Set(validationMessages)].join(" • ");
  return problem.detail ?? problem.title ?? `Yêu cầu API thất bại (HTTP ${status}).`;
}

function apiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!value) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  return value;
}

export function apiAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
  const apiBase = apiBaseUrl();
  const origin = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${apiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`, { ...init, headers });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({})) as ProblemDetails;
    throw new ApiError(response.status, problem);
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`/api/backend${path.startsWith("/") ? path : `/${path}`}`, { ...init, headers, cache: "no-store" });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({})) as ProblemDetails;
    throw new ApiError(response.status, problem);
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}
