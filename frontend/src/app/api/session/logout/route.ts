import { NextResponse } from "next/server";
import { callBackend, clearSessionCookies, getSessionRefreshToken, getValidAccessToken, isSameOrigin, problemResponse } from "@/lib/server/backend-session";

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return problemResponse(403, "Nguồn yêu cầu không hợp lệ.");
  const refreshToken = await getSessionRefreshToken();
  const access = await getValidAccessToken();
  if (refreshToken && access) {
    // Best effort: cookies are cleared even if the backend is temporarily
    // unavailable, while a successful call revokes both token families.
    await callBackend("/auth/logout", {
      method: "POST",
      headers: { Authorization: "Bearer " + access.accessToken },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }
  const response = new NextResponse(null, { status: 204 });
  clearSessionCookies(response);
  return response;
}
