import { NextResponse } from "next/server";
import { applySessionCookies, backendApiUrl, forwardBackendResponse, getValidAccessToken, isSameOrigin, problemResponse } from "@/lib/server/backend-session";

export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return problemResponse(403, "Nguồn yêu cầu không hợp lệ.");

  const auth = await getValidAccessToken();
  if (!auth) return problemResponse(401, "Phiên đăng nhập đã hết hạn.");

  const backendResponse = await fetch(backendApiUrl("/profile"), {
    method: "PUT",
    headers: { 
        Accept: "application/json", 
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify(await request.json()),
    cache: "no-store",
  });
  
  const response = backendResponse.ok
    ? NextResponse.json(await backendResponse.json())
    : await forwardBackendResponse(backendResponse);
    
  if (auth.refreshedAuth) applySessionCookies(response, auth.refreshedAuth);
  return response;
}
