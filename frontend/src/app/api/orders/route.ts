import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { callBackend, forwardBackendResponse, isSameOrigin, problemResponse } from "@/lib/server/backend-session";

const maxBodyBytes = 128 * 1024;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return problemResponse(403, "Nguồn yêu cầu không hợp lệ.");

  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim() ?? "";
  if (idempotencyKey.length < 16 || idempotencyKey.length > 128 || /[\u0000-\u001f\u007f]/.test(idempotencyKey)) {
    return problemResponse(400, "Idempotency-Key phải dài 16-128 ký tự hợp lệ.");
  }

  const raw = await request.text();
  if (raw.length > maxBodyBytes) return problemResponse(413, "Payload quá lớn.");
  let parsed: Record<string, unknown>;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("object-required");
    parsed = value as Record<string, unknown>;
  } catch {
    return problemResponse(400, "JSON không hợp lệ.");
  }

  // Never forward browser-controlled affiliate identity. The only accepted
  // credential is the signed proof held in an HttpOnly cookie.
  const safeBody = { ...parsed };
  for (const key of Object.keys(safeBody)) {
    if (["affiliatecode", "affiliatevisitid", "affiliateproof"].includes(key.toLowerCase())) delete safeBody[key];
  }
  const store = await cookies();
  const proof = store.get("mn_affiliate_proof")?.value;
  const affiliateCode = store.get("mn_affiliate_code")?.value;
  const affiliateVisitId = store.get("mn_affiliate_visit")?.value;
  // These values are server-managed HttpOnly cookies. The backend still
  // verifies the signed proof and the referral row, so cookie tampering alone
  // cannot create commission attribution.
  if (proof && affiliateCode && affiliateVisitId) {
    safeBody.affiliateCode = affiliateCode;
    safeBody.affiliateVisitId = affiliateVisitId;
    safeBody.affiliateProof = proof;
  }

  const backendResponse = await callBackend("/order-requests", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(safeBody),
  });
  const response = await forwardBackendResponse(backendResponse);
  response.headers.set("Cache-Control", "no-store");
  if (backendResponse.status >= 200 && backendResponse.status < 300) {
    // A referral is single-conversion by design. Clearing the attribution proof
    // after a successful order prevents a later unrelated order from replaying
    // the same VisitId and confusing the customer with a 409.
    clearAffiliateCookies(response);
  }
  return response;
}

function clearAffiliateCookies(response: NextResponse) {
  const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.SESSION_COOKIE_SECURE === "true", path: "/", maxAge: 0 };
  response.cookies.set("mn_affiliate_proof", "", options);
  response.cookies.set("mn_affiliate_code", "", options);
  response.cookies.set("mn_affiliate_visit", "", options);
}
