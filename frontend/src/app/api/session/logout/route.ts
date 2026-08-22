import { NextResponse } from "next/server";
import { clearSessionCookies, isSameOrigin, problemResponse } from "@/lib/server/backend-session";

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return problemResponse(403, "Nguồn yêu cầu không hợp lệ.");
  const response = new NextResponse(null, { status: 204 });
  clearSessionCookies(response);
  return response;
}
