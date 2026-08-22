import { Container } from "@/components/layout/container";
import { PlanComparison } from "@/features/pricing/plan-comparison";

export default function ComparePage() {
  return <main className="py-14 md:py-20"><Container><div className="mb-9 max-w-3xl"><p className="text-sm font-semibold text-river-700">Plan compare</p><h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Đặt tối đa ba gói lên cùng một mặt phẳng</h1><p className="mt-4 text-slate-600">So sánh CPU, RAM, lưu trữ, băng thông và bảng giá hiện hành mà không sao chép dữ liệu sang frontend.</p></div><PlanComparison /></Container></main>;
}
