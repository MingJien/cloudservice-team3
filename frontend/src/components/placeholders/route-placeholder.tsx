import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/layout/page-heading";

export function RoutePlaceholder({ title, owner, description }: { title: string; owner: string; description: string }) {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading title={title} description={description} />
      <Card><Badge variant="info">Placeholder</Badge><p className="mt-4 text-sm leading-6 text-slate-600">Chủ module: <strong className="text-ink-950">{owner}</strong>. Route đã được giữ chỗ; chưa có API hoặc giao diện nghiệp vụ.</p></Card>
    </div>
  );
}
