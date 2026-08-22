import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const accessCookieName = "mekongnode_access";
const refreshCookieName = "mekongnode_refresh";

export interface SessionUser {
  id: number;
  userName: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface BackendAuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: SessionUser;
}

export function backendApiUrl(path: string) {
  const baseUrl = (process.env.BACKEND_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL)?.replace(/\/$/, "");
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function callBackend(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(backendApiUrl(path), { ...init, headers, cache: "no-store" });
}

export function applySessionCookies(response: NextResponse, auth: BackendAuthResponse) {
  response.cookies.set(accessCookieName, auth.accessToken, cookieOptions(auth.accessTokenExpiresAt));
  response.cookies.set(refreshCookieName, auth.refreshToken, cookieOptions(auth.refreshTokenExpiresAt));
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(accessCookieName, "", { ...baseCookieOptions(), maxAge: 0 });
  response.cookies.set(refreshCookieName, "", { ...baseCookieOptions(), maxAge: 0 });
}

export async function getValidAccessToken(): Promise<{ accessToken: string; refreshedAuth?: BackendAuthResponse } | null> {
  const store = await cookies();
  const accessToken = store.get(accessCookieName)?.value;
  if (accessToken && !isExpired(accessToken)) return { accessToken };

  const refreshToken = store.get(refreshCookieName)?.value;
  if (!refreshToken) return null;
  const response = await callBackend("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) return null;

  const auth = await response.json() as BackendAuthResponse;
  return { accessToken: auth.accessToken, refreshedAuth: auth };
}

export function sessionFromAccessToken(accessToken: string): SessionUser | null {
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8")) as Record<string, unknown>;
    const nameClaim = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
    const idClaim = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
    const roleClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    const userName = String(payload.unique_name ?? payload[nameClaim] ?? "");
    const id = Number(payload.sub ?? payload[idClaim]);
    if (!userName || !Number.isInteger(id)) return null;
    return {
      id,
      userName,
      fullName: userName,
      email: String(payload.email ?? ""),
      role: String(payload.role ?? payload[roleClaim] ?? ""),
    };
  } catch {
    return null;
  }
}

export async function forwardBackendResponse(response: Response) {
  const body = response.status === 204 ? null : await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/problem+json" },
  });
}

export function problemResponse(status: number, title: string, detail?: string) {
  return NextResponse.json({ status, title, detail }, { status });
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    const fetchSite = request.headers.get("sec-fetch-site");
    return !fetchSite || fetchSite === "none" || fetchSite === "same-origin";
  }

  try {
    const originUrl = new URL(origin);
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const requestHost = request.headers.get("host") || forwardedHost || new URL(request.url).host;
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const requestProtocol = forwardedProtocol || new URL(request.url).protocol.replace(":", "");

    return originUrl.host === requestHost && originUrl.protocol === `${requestProtocol}:`;
  } catch {
    return false;
  }
}

function baseCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.SESSION_COOKIE_SECURE === "true",
    path: "/",
  };
}

function cookieOptions(expiresAt: string) {
  const maxAge = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  return { ...baseCookieOptions(), maxAge };
}

function isExpired(token: string) {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as { exp?: number };
    return !payload.exp || payload.exp * 1000 <= Date.now() + 30_000;
  } catch {
    return true;
  }
}
