import { NextResponse } from "next/server";
import { applySessionCookies, callBackend, clearSessionCookies, forwardBackendResponse, getValidAccessToken, problemResponse } from "@/lib/server/backend-session";

export async function GET() {
  const token = await getValidAccessToken();
  if (!token) {
    const response = problemResponse(401, "Phiên đăng nhập không hợp lệ.");
    clearSessionCookies(response);
    return response;
  }

  const backendResponse = await callBackend("/profile", {
    headers: { Authorization: `Bearer ${token.accessToken}` },
  });
  if (!backendResponse.ok) {
    const response = await forwardBackendResponse(backendResponse);
    if (token.refreshedAuth) applySessionCookies(response, token.refreshedAuth);
    return response;
  }

  const user = await backendResponse.json();
  const response = NextResponse.json({ user });
  if (token.refreshedAuth) applySessionCookies(response, token.refreshedAuth);
  return response;
}