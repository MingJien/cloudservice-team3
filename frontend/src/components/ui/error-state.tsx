import { Button } from "./button";

export function ErrorState({ title = "Không thể tải dữ liệu", description = "Vui lòng thử lại sau.", onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-danger-600/25 bg-danger-600/5 px-6 py-8 text-center" role="alert">
      <h3 className="font-semibold text-danger-600">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {onRetry && <Button className="mt-5" variant="secondary" onClick={onRetry}>Thử lại</Button>}
    </div>
  );
}
