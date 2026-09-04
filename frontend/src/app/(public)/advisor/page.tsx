import { Container } from "@/components/layout/container";
import { AdvisorForm } from "@/features/recommendations/advisor-form";

export default function AdvisorPage() {
  return <main className="py-14 md:py-20"><Container><div className="mb-9 max-w-3xl"><p className="text-sm font-semibold text-river-700">Rule-based advisor</p><h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Gợi ý có lý do, không dùng mô hình AI bên ngoài</h1><p className="mt-4 text-slate-600">Bốn nhóm quy tắc chấm điểm các gói đang hoạt động theo ngân sách, cấu hình, traffic và mục đích sử dụng.</p></div><AdvisorForm /></Container></main>;
}
