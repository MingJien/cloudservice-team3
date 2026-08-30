import { NextResponse } from "next/server";
import { applySessionCookies, callBackend, forwardBackendResponse, getValidAccessToken, isSameOrigin, problemResponse } from "@/lib/server/backend-session";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, context: RouteContext) {
  // The proxy carries an authenticated session cookie, so even read-only
  // requests must not be usable as a cross-site data oracle.
  if (!isSameOrigin(request)) {
    return problemResponse(403, "Nguồn yêu cầu không hợp lệ.");
  }

  const { path } = await context.params;
  const auth = await getValidAccessToken();
  if (!auth) return NextResponse.json({ status: 401, title: "Phiên đăng nhập đã hết hạn." }, { status: 401 });

  const backendPath = `/${path.join("/")}${new URL(request.url).search}`;
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("cookie");
  headers.delete("origin");
  headers.delete("content-length");
  // Nginx may add hop-by-hop headers (notably `Connection: upgrade`) while
  // forwarding a normal HTTP request. Node's undici fetch rejects those
  // headers; they also have no meaning on the server-to-server hop.
  for (const header of ["connection", "upgrade", "keep-alive", "transfer-encoding", "te", "trailer", "proxy-authorization", "proxy-authenticate"]) {
    headers.delete(header);
  }
  headers.set("Authorization", `Bearer ${auth.accessToken}`);
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();
  const backendResponse = await callBackend(backendPath, { method: request.method, headers, body });
  const response = await forwardBackendResponse(backendResponse);
  if (auth.refreshedAuth) applySessionCookies(response, auth.refreshedAuth);
  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
