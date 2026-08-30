import { NextResponse } from "next/server";
import { applySessionCookies, callBackend, clearSessionCookies, forwardBackendResponse, getValidAccessToken, isSameOrigin, problemResponse } from "@/lib/server/backend-session";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return problemResponse(403, "Nguồn yêu cầu không hợp lệ.");
  const token = await getValidAccessToken();
  if (!token) return problemResponse(401, "Phiên đăng nhập đã hết hạn.");

  const backendResponse = await callBackend("/auth/change-password", {
    method: "POST",
    headers: { Authorization: `Bearer ${token.accessToken}` },
    body: await request.text(),
  });
  const response = backendResponse.ok ? new NextResponse(null, { status: 204 }) : await forwardBackendResponse(backendResponse);
  if (backendResponse.ok) clearSessionCookies(response);
  else if (token.refreshedAuth) applySessionCookies(response, token.refreshedAuth);
  return response;
}
