import { NextResponse } from "next/server";
import { applySessionCookies, callBackend, forwardBackendResponse, isSameOrigin, problemResponse } from "@/lib/server/backend-session";
import type { BackendAuthResponse } from "@/lib/server/backend-session";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return problemResponse(403, "Nguồn yêu cầu không hợp lệ.");
  const response = await callBackend("/auth/login", { method: "POST", body: await request.text() });
  if (!response.ok) return forwardBackendResponse(response);

  const auth = await response.json() as BackendAuthResponse;
  const result = NextResponse.json({ user: auth.user, accessTokenExpiresAt: auth.accessTokenExpiresAt });
  applySessionCookies(result, auth);
  return result;
}
