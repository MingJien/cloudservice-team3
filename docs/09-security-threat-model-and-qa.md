# Security threat model và QA checklist

## Tài sản cần bảo vệ

- Credential, password hash, access token và refresh token.
- Dữ liệu liên hệ, order note, affiliate application và audit trail.
- Bảng giá, promotion, trạng thái đơn và nội dung public.
- Tính toàn vẹn của migration/database và pipeline CI.

## Threat model rút gọn

| Threat | Control | Verification |
|---|---|---|
| Brute-force login | Fixed-window rate limit theo IP, audit failed login | Gửi quá ngưỡng login và kiểm tra 429 |
| Token theft/replay | HttpOnly cookie, refresh hash, rotation, reuse detection | Refresh token cũ phải bị từ chối |
| Weak/demo production config | Production fail-fast với JWT secret placeholder/local, demo seed hoặc reset mật khẩu | Chạy Production bằng config local và xác nhận app từ chối startup |
| Broken access control | Role authorization ở controller/service | Editor không truy cập route Admin-only |
| IDOR/data leak | Public DTO không chứa internal note; tracking theo code | Gọi public detail và review response |
| SQL injection | EF Core parameterized query và DTO validation | Thử input ký tự đặc biệt trong search/filter |
| XSS qua blog | Frontend render content dạng text, không raw HTML | Chèn markup và xác nhận không thực thi |
| CSRF | Same-origin BFF guard, SameSite cookie | Gọi mutation với Origin khác và kiểm tra từ chối |
| Audit tampering | Audit append-only application path, Admin read | Kiểm tra mọi mutation có actor/action/entity |
| Secret leakage | `.gitignore`, env examples không có secret thật | `git diff --check`, secret scan trước PR |
| Destructive deployment | Migration opt-in, không drop database khi startup | Đọc config và chạy smoke trên DB có dữ liệu |

## QA levels

### Unit

- Domain invariant: tên, slug, rating, amount, status transition.
- Pricing: cycle, percentage/fixed discount, min order, usage limit, expired promotion.
- Recommendation: rule scoring và giải thích kết quả.
- Authentication: PBKDF2 verify, refresh rotation/reuse.

### Integration/manual

- API ProblemDetails: validation, 401, 403, 404, conflict và rate limit.
- Catalog/order/content/admin workflows theo `docs/08-completed-system-and-demo.md`.
- Responsive public/admin pages ở viewport desktop và mobile.
- Docker startup từ database trống và database đã có migration.

### Regression checklist

```text
[ ] dotnet build backend/CloudService.sln --no-restore
[ ] dotnet test backend/CloudService.sln --no-build --collect:"XPlat Code Coverage" --settings backend/coverage.runsettings
[ ] npm run lint
[ ] npx tsc --noEmit
[ ] npm run build
[ ] docker compose config
[ ] không có secret trong git diff
[ ] `/health`, `/health/ready` và Swagger phản hồi sau deploy
```

Đây là checklist kỹ thuật, không phải cam kết an ninh tuyệt đối. Khi deploy thật cần bổ sung secret manager, HTTPS termination, backup/restore drill, log retention, monitoring và penetration test phù hợp.
