"use client";

import { useEffect, useState } from "react";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { ScrollRevealTableBody } from "@/components/ui/scroll-reveal-list";
import { DataTable, TableShell } from "@/components/ui/table-shell";
import { getAuditLogs } from "@/features/auth/audit-log-client";
import type { AuditLogPage } from "@/features/auth/audit-log-client";

export default function AuditLogsPage() {
  const [pageNumber, setPageNumber] = useState(1);
  const [actionInput, setActionInput] = useState("");
  const [action, setAction] = useState("");
  const [data, setData] = useState<AuditLogPage | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getAuditLogs(pageNumber, action)
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setData(null);
          setError(caught instanceof Error ? caught.message : "Không thể tải nhật ký.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [action, pageNumber]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeading
        title="Nhật ký hệ thống"
        description="Chỉ Admin được xem lịch sử đăng nhập, refresh token và đổi mật khẩu. Nhật ký không chứa password, JWT hoặc refresh token."
      />
      <div className="mb-5 rounded-2xl border border-line-200 bg-white p-4">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            setLoading(true);
            setPageNumber(1);
            setAction(actionInput);
          }}
        >
          <Input
            className="sm:min-w-80"
            label="Lọc theo hành động"
            name="action"
            value={actionInput}
            onChange={(event) => setActionInput(event.target.value)}
            placeholder="Ví dụ: Auth.Login"
          />
          <Button type="submit" variant="secondary">Áp dụng bộ lọc</Button>
        </form>
      </div>
      <TableShell
        loading={loading}
        error={error}
        isEmpty={!loading && !error && (data?.items.length ?? 0) === 0}
        emptyTitle="Không có nhật ký phù hợp"
        footer={data ? (
          <Pagination
            pageNumber={data.pageNumber}
            totalPages={data.totalPages}
            onPageChange={(page) => {
              setLoading(true);
              setPageNumber(page);
            }}
          />
        ) : undefined}
      >
        {data && (
          <DataTable caption="Danh sách nhật ký hệ thống">
            <thead className="bg-ice-100/70">
              <tr>
                <th className="px-4 py-3">Thời điểm</th>
                <th className="px-4 py-3">Hành động</th>
                <th className="px-4 py-3">Tài khoản</th>
                <th className="px-4 py-3">Đối tượng</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <ScrollRevealTableBody className="divide-y divide-line-200">
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {new Intl.DateTimeFormat("vi-VN", {
                      dateStyle: "short",
                      timeStyle: "medium",
                      timeZone: "Asia/Ho_Chi_Minh",
                    }).format(new Date(item.createdAt))}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.action.includes("Failed") || item.action.includes("Reuse") ? "danger" : "info"}>
                      {item.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{item.userName ?? "Hệ thống/Ẩn danh"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.entityName ? `${item.entityName} #${item.entityId ?? "-"}` : "-"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.ipAddress ?? "-"}</td>
                </tr>
              ))}
            </ScrollRevealTableBody>
          </DataTable>
        )}
      </TableShell>
    </div>
  );
}
