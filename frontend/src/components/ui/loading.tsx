export function Loading({ label = "Đang tải dữ liệu" }: { label?: string }) {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label={label} role="status">
      <span className="sr-only">{label}</span>
      {[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-ice-100" />)}
    </div>
  );
}
