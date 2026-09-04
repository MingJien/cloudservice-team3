import { Container } from "@/components/layout/container";
import { PricingCalculator } from "@/features/pricing/pricing-calculator";

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ planId?: string; promotionCode?: string }> }) {
  const query = await searchParams;
  const planId = query.planId && /^\d+$/.test(query.planId) ? Number(query.planId) : undefined;
  const promotionCode = query.promotionCode && /^[A-Za-z0-9_-]{1,50}$/.test(query.promotionCode) ? query.promotionCode.toUpperCase() : undefined;
  return (
    <main className="py-14 md:py-20">
      <Container>
        <div className="mb-9 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-river-700">Công cụ báo giá</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Tính thử chi phí trước khi gửi yêu cầu</h1>
          <p className="mt-4 leading-7 text-slate-600">
            Chọn mã gói và chu kỳ thanh toán. API sẽ lấy đúng bảng giá còn hiệu lực, kiểm tra mã khuyến mãi rồi mới trả kết quả.
          </p>
        </div>
        <PricingCalculator initialPlanId={planId} initialPromotionCode={promotionCode} />
      </Container>
    </main>
  );
}
