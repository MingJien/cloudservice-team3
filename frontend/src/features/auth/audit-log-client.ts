import { ApiError } from "@/lib/api-client";
import type { ProblemDetails } from "@/lib/api-client";

export interface AuditLogItem {
  id: number;
  userId: number | null;
  userName: string | null;
  action: string;
  entityName: string | null;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogPage {
  items: AuditLogItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export async function getAuditLogs(pageNumber: number, action: string) {
  const params = new URLSearchParams({ pageNumber: String(pageNumber), pageSize: "20" });
  if (action.trim()) params.set("action", action.trim());
  const response = await fetch(`/api/admin/audit-logs?${params}`, { cache: "no-store" });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({})) as ProblemDetails;
    throw new ApiError(response.status, problem);
  }
  return response.json() as Promise<AuditLogPage>;
}
