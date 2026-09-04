import { applySessionCookies, callBackend, forwardBackendResponse, getValidAccessToken, isSameOrigin, problemResponse } from "@/lib/server/backend-session";

export async function GET(request: Request) {
  if (!isSameOrigin(request)) return problemResponse(403, "Nguồn yêu cầu không hợp lệ.");
  const token = await getValidAccessToken();
  if (!token) return problemResponse(401, "Phiên đăng nhập đã hết hạn.");

  const sourceUrl = new URL(request.url);
  const backendResponse = await callBackend(`/audit-logs${sourceUrl.search}`, {
    headers: { Authorization: `Bearer ${token.accessToken}` },
  });
  const response = await forwardBackendResponse(backendResponse);
  if (token.refreshedAuth) applySessionCookies(response, token.refreshedAuth);
  return response;
}
