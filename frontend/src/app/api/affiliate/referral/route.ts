import { NextResponse } from "next/server";
import { callBackend, forwardBackendResponse, isSameOrigin, problemResponse } from "@/lib/server/backend-session";

const proofCookie = "mn_affiliate_proof";
const codeCookie = "mn_affiliate_code";
const visitCookie = "mn_affiliate_visit";
const maxBodyBytes = 64 * 1024;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return problemResponse(403, "Nguồn yêu cầu không hợp lệ.");

  const raw = await request.text();
  if (raw.length > maxBodyBytes) return problemResponse(413, "Payload quá lớn.");

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return problemResponse(400, "JSON không hợp lệ.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return problemResponse(400, "Payload không hợp lệ.");
  const tracked = body as Record<string, unknown>;
  const rawCode = tracked.AffiliateCode ?? tracked.affiliateCode;
  const rawVisitId = tracked.VisitId ?? tracked.visitId;
  const affiliateCode = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : "";
  const visitId = typeof rawVisitId === "string" ? rawVisitId.trim() : "";
  if (!/^[A-Z0-9_-]{3,50}$/.test(affiliateCode) || !/^[0-9a-f-]{36}$/i.test(visitId)) {
    return problemResponse(400, "Thông tin giới thiệu không hợp lệ.");
  }

  const backendResponse = await callBackend("/affiliate-referrals", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!backendResponse.ok) return forwardBackendResponse(backendResponse);

  const result = await backendResponse.json() as {
    accepted: boolean;
    expiresAtUtc: string | null;
    proof?: string | null;
  };
  const response = NextResponse.json({
    accepted: result.accepted,
    expiresAtUtc: result.expiresAtUtc,
  }, { status: backendResponse.status });

  if (result.accepted && result.proof && result.expiresAtUtc) {
    const maxAge = Math.max(0, Math.min(
      60 * 24 * 60 * 60,
      Math.floor((new Date(result.expiresAtUtc).getTime() - Date.now()) / 1000),
    ));
    response.cookies.set(proofCookie, result.proof, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.SESSION_COOKIE_SECURE === "true",
      path: "/",
      maxAge,
    });
    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.SESSION_COOKIE_SECURE === "true",
      path: "/",
      maxAge,
    };
    response.cookies.set(codeCookie, affiliateCode, cookieOptions);
    response.cookies.set(visitCookie, visitId, cookieOptions);
  } else {
    // Never retain a previous partner's proof when the current attribution is
    // rejected or malformed. Stale identity is worse than losing analytics.
    clearAttributionCookies(response);
  }

  return response;
}

function clearAttributionCookies(response: NextResponse) {
  const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.SESSION_COOKIE_SECURE === "true", path: "/", maxAge: 0 };
  response.cookies.set(proofCookie, "", options);
  response.cookies.set(codeCookie, "", options);
  response.cookies.set(visitCookie, "", options);
}
