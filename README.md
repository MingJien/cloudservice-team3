# CloudService — MekongNode

CloudService là hệ thống website bán và quản trị dịch vụ cloud gồm VPS, hosting, domain, email, SSL và các gói hạ tầng liên quan. Bản này là bản tích hợp hoàn chỉnh từ nền tảng `CloudService-TV1`: backend, frontend, database contract, public website, admin console, tài liệu demo, kiểm thử, Docker và CI đều nằm trong cùng một repository.

## 1. Phạm vi đã hoàn thiện

### Website public

- Landing page lấy dữ liệu thật từ API: gói nổi bật, danh mục, tin tức, testimonial và CTA.
- Catalog dịch vụ, tìm kiếm theo tên, trang chi tiết và QR URL cho từng gói.
- Pricing theo chu kỳ, promotion, so sánh gói và advisor theo ngân sách/cấu hình.
- Tạo yêu cầu đặt dịch vụ, sinh mã tra cứu, tra cứu trạng thái an toàn.
- Blog: danh mục, tìm kiếm, phân trang, chi tiết bài viết và tăng lượt xem.
- Đánh giá sau đơn hoàn tất: một phản hồi/đơn, đồng ý công bố, chờ kiểm duyệt và nhãn gói nổi bật do backend xác định khi giá trị đơn lớn hơn 5.000.000đ.
- Contact và affiliate application có validation, trạng thái xử lý và giao diện phản hồi rõ ràng; Affiliate chặn trùng email/điện thoại/HTTPS channel bằng cả pre-check và unique index SQL.
- Affiliate Last-Click 60 ngày xuyên suốt URL `?ref=...` → cookie → order → giữ hoa hồng 30 ngày → ví khả dụng → đối soát.
- About, datacenter/SLA content theo nguyên tắc chỉ công bố số liệu đã xác minh.

### Admin console

- Login, refresh rotation, đổi mật khẩu, session BFF bằng HttpOnly cookie.
- Dashboard KPI và trạng thái đơn hàng.
- CRUD danh mục, gói dịch vụ, giá, promotion, QR; soft-disable thay vì xóa tùy tiện.
- Quản lý orders, affiliate applications, news categories/articles, testimonials và contacts.
- Publish/unpublish bài viết, chuyển trạng thái nghiệp vụ, export order thành workbook `.xlsx` mở trực tiếp bằng Excel/LibreOffice.
- Audit log cho thao tác quản trị và các sự kiện authentication quan trọng.
- Quản lý attribution/hoa hồng Affiliate, cấp tài khoản khi duyệt, đối soát rút tiền và optimistic concurrency khi nhiều Admin cùng thao tác.
- Partner Portal riêng với KPI click/chuyển đổi, sổ commission phân trang, rank Newbie/Bronze/Silver/Gold và ví rút tiền tối thiểu 500.000đ.

## 2. Kiến trúc

```text
CloudService/
├─ backend/
│  ├─ src/CloudService.Domain/          # entity, enum, invariant, domain behavior
│  ├─ src/CloudService.Application/     # use case, DTO, validation, interface
│  ├─ src/CloudService.Infrastructure/  # EF Core, SQL Server, JWT, PBKDF2, QR, repositories
│  ├─ src/CloudService.WebApi/          # controller, ProblemDetails, Swagger, health, CORS
│  └─ tests/                            # xUnit, Moq, domain/application tests
├─ frontend/
│  ├─ src/app/                          # public/admin App Router và BFF route
│  ├─ src/components/                   # UI, layout, landing và management views
│  ├─ src/features/                     # auth, pricing, catalog, orders, content, affiliate, dashboard
│  └─ public/
├─ database/                            # schema contract, seed/reference data, exports/uploads
├─ docs/                                # contract, phân công, demo runbook, threat model
├─ tests/postman/                       # collection không chứa credential/token thật
├─ scripts/load/k6-orders.js            # kịch bản load/stress có threshold minh bạch
├─ Dockerfile.api
├─ Dockerfile.frontend
├─ docker-compose.yml
└─ .github/workflows/main.yml           # release gate đầy đủ
```

Backend dùng Clean Architecture 4 lớp. Application không phụ thuộc EF Core; Infrastructure triển khai các port/repository. Các pattern chính:

1. Repository + Unit of Work cho truy cập dữ liệu và transaction boundary.
2. Strategy cho percentage/fixed promotion và các rule recommendation độc lập.
3. Factory cho `OrderRequest` và tracking code CSPRNG, giúp gom invariant khởi tạo và tránh mã tuần tự dễ đoán.
4. Provider/Adapter cho QR generator, giúp thay implementation mà không đổi use case.
5. BFF session facade ở Next.js để browser không giữ access/refresh token trong localStorage.
6. Transactional Outbox cho Telegram: external API lỗi không rollback Order; worker có lease, retry/backoff và dead-letter.
7. Persistent Idempotency cho Create Order: cùng key/payload trả response cũ cả khi restart hoặc chạy nhiều API instance.
8. Optimistic Concurrency bằng SQL `rowversion` cho trạng thái đơn và các aggregate có rủi ro ghi đè.

## 3. Công nghệ và yêu cầu môi trường

- .NET SDK 10.0.x (được khóa major/feature band bằng `global.json`), ASP.NET Core Web API và EF Core SQL Server.
- Node.js 20.9+, npm, Next.js App Router, React, TypeScript strict, Tailwind CSS.
- SQL Server 2022 hoặc Docker Desktop.
- PowerShell trên Windows; Linux/macOS có thể dùng các lệnh tương đương.

## 4. Chạy nhanh bằng Docker

Đây là đường chạy khuyến nghị để demo vì không phụ thuộc instance SQL Server local:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Sau khi các container healthy:

- Website: `http://localhost:3000`
- API health: `http://localhost:8080/health`
- API readiness + SQL Server: `http://localhost:8080/health/ready`
- Swagger: `http://localhost:8080/swagger`
- SQL Server: `localhost,14330`

Compose chỉ dùng credential mặc định cho môi trường local demo. Trước khi dùng thật, thay `MSSQL_SA_PASSWORD`, `JWT_SECRET`, password seed và tắt seed demo. Không commit `.env`.

Tài khoản demo được seed khi `SEED_DEMO_USERS_ENABLED=true`:

- Admin local demo: username `admin`, password `ad123` (hoặc giá trị `SEED_ADMIN_PASSWORD`).
- Editor: username `editor`, password lấy từ `SEED_EDITOR_PASSWORD`.
- Affiliate Bạc: username `affb`, password `affb123`, portal `/affiliate/login`.

Compose đặt `SEED_DEMO_USERS_RESET_PASSWORD_ON_STARTUP=true` cho local demo, nên mỗi lần khởi động sẽ đặt lại password của các demo user và thu hồi refresh token cũ. Trước khi dùng môi trường không phải demo, đặt biến này thành `false` và dùng mật khẩu mạnh riêng.

Compose đồng thời bật `SEED_DEMO_CONTENT_ENABLED=true` để tạo bốn bài viết kỹ thuật hoàn chỉnh (ảnh local + Markdown có cấu trúc), hai luồng hỏi–đáp công khai có phản hồi của cả Admin và Editor, cùng một testimonial được đánh dấu rõ là `Demo Workspace`; đây là dữ liệu kiểm thử, không phải khách hàng thật. Seeder chỉ thêm bản ghi thiếu theo slug/tracking code, nên dữ liệu còn lại sau restart và không ghi đè nội dung người dùng đã chỉnh.

### Demo public bằng Cloudflare Quick Tunnel

Để chạy đúng profile bàn giao (DB + API + frontend + Nginx) và nhận một URL HTTPS công khai, mở PowerShell/Terminal VS Code ở bất kỳ thư mục nào rồi chạy một lệnh:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\ProJect\HK7_y25-26\pt PM HĐT\BT end\CloudService\scripts\start-demo-deploy.ps1"
```

Script ghép `docker-compose.prod.yml` với overlay demo `docker-compose.demo.yml`, tự kiểm tra/sinh `JWT_SECRET` khi còn placeholder, bảo toàn Telegram secrets trong `.env`, tạo một tài khoản Affiliate duy nhất `affb / affb123` (hạng Bạc) với biểu đồ, ledger đơn và payout thật từ database demo. Script build .NET/Next.js tuần tự để hợp laptop 8 GB, khởi động Quick Tunnel và kiểm tra HTTP `200` ở local lẫn public. Frontend Compose gọi `/api` cùng origin nên URL `trycloudflare.com` mới không làm hỏng browser bundle. Sau mỗi lần Docker Desktop khởi động lại, chạy lại đúng lệnh trên; hostname có thể đổi. Không chạy `docker compose down -v` vì sẽ xóa dữ liệu SQL Server. Xem [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) để biết giới hạn của Quick Tunnel và quy trình VPS/domain.

Để reset dữ liệu demo, dừng stack rồi xóa volume `cloudservice-sqlserver` sau khi đã xác nhận đó chỉ là dữ liệu local. Không dùng thao tác xóa volume với môi trường có dữ liệu thật.

## 5. Chạy local không Docker

Thiết lập connection string SQL Server và secret bằng environment variable hoặc user-secrets. Ví dụ:

```powershell
$env:Jwt__Secret = "REPLACE_WITH_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS"
$env:Database__ApplyMigrationsOnStartup = "false"
dotnet restore backend/CloudService.sln
dotnet build backend/CloudService.sln --no-restore
dotnet run --project backend/src/CloudService.WebApi/CloudService.WebApi.csproj --urls http://localhost:8080
```

Nếu database chưa có schema, tạo migration/update bằng `dotnet ef database update` với connection string của môi trường local. Ứng dụng không drop hoặc recreate database khi khởi động.

Terminal frontend:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Giữ `SESSION_COOKIE_SECURE=false` khi chạy HTTP local; đặt `true` khi deploy sau HTTPS.

Nếu đặt đơn/cập nhật trạng thái thành công nhưng Telegram không báo, đây không phải lỗi lưu đơn: mặc định `Telegram:Enabled=false` và sự kiện được giữ trong `OutboxMessages`. Với máy phát triển, chạy `powershell -ExecutionPolicy Bypass -File .\scripts\configure-local-secrets.ps1` tại thư mục repository, nhập token mới và Chat ID rồi khởi động lại API. Script lưu Telegram/JWT bằng .NET user-secrets bên ngoài Git, dùng chung cho Visual Studio F5 và `dotnet run`. Hướng dẫn triển khai nằm trong `docs/14-affiliate-outbox-idempotency-runbook.md`. Khi bật lại, worker sẽ gửi cả backlog chưa xử lý; kiểm tra trước để tránh dồn nhiều thông báo vào nhóm demo.

Email cấp tài khoản Affiliate mặc định tắt. Khi triển khai, cấu hình `SMTP_ENABLED`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_ENABLE_SSL`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL` và `SMTP_PORTAL_URL` bằng secret manager/biến môi trường; không điền mật khẩu SMTP vào repository. Nếu SMTP lỗi, việc duyệt vẫn được commit và Admin nhận trạng thái `Failed` cùng thông tin tạm thời hiển thị đúng một lần để bàn giao bằng kênh an toàn.

Trước khi commit/push, chạy `powershell -ExecutionPolicy Bypass -File .\scripts\check-staged-secrets.ps1` sau `git add`. `.env`, `secrets.json`, certificate/private key và cấu hình local đã được `.gitignore`; không dùng `git add -f` cho các file này.

## 6. API chính

| Nhóm | Endpoint tiêu biểu | Quyền |
|---|---|---|
| Auth | `POST /api/auth/login`, `/refresh`, `/change-password` | Public / mọi tài khoản đã xác thực |
| Catalog | `GET /api/service-categories`, `/service-plans`, `/serviceplans/{id}/qr` | Public; write Admin |
| Pricing | `POST /api/pricing/quotes`, `GET /api/service-plans/compare` | Public |
| Advisor | `POST /api/service-plan-recommendations` | Public |
| Orders | `POST /api/order-requests`, `GET /api/order-requests/track/{code}`, `POST /api/order-requests/export`, `GET /api/order-requests/export/{jobId}`, `GET /api/order-requests/export/{jobId}/download` | Public create/track; Admin update/export |
| Affiliate tracking | `POST /api/affiliate-referrals` | Public, rate-limited |
| Content | `POST /api/contact-requests`, `GET /api/contact-requests/tracking/{code}`, `PATCH /api/contact-requests/{id}/reply` | Public create/track; Admin/Editor reply |
| Testimonial | `GET /api/testimonials`, `POST /api/testimonials/submissions` | Public list/submit; submit rate-limited, chỉ đơn `Done` |
| Affiliate | `POST /api/affiliate-applications`, `GET /api/affiliate-applications/tracking/{code}`, admin list/status | Public submit/track bằng mã opaque; Admin/Editor xử lý |
| Affiliate Portal | `GET /api/affiliate-portal/dashboard`, `/orders`, `/payouts`; `POST /payouts` | Affiliate |
| Affiliate Payout | `GET /api/affiliate-payouts`, `PATCH /{id}/status` | Admin |
| Dashboard | `GET /api/dashboard/summary` | Admin |
| Audit | `GET /api/audit-logs` | Admin |

Response lỗi chuẩn hóa bằng RFC 7807 ProblemDetails, có `traceId`; endpoint list hỗ trợ paging/filter/sort ở các module phù hợp. Swagger có Bearer JWT scheme.

## 7. Kiểm thử và CI

Chạy trước khi tạo pull request:

```powershell
dotnet build backend/CloudService.sln --no-restore
dotnet test backend/CloudService.sln --no-build --collect:"XPlat Code Coverage" --settings backend/coverage.runsettings

cd frontend
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

GitHub Actions trong `.github/workflows/main.yml` là release gate: backend restore/build/test/coverage, integration test với SQL Server Testcontainers, frontend lint/typecheck/Jest/build, Docker Compose smoke test, Playwright E2E và k6. Workflow cũ `.github/workflows/ci.yml` vẫn là gate nhẹ cho pull request. Cả hai phải xanh trước khi merge. Lịch sử commit/PR của bốn thành viên phải là lịch sử thật của nhóm; tài liệu không giả lập contribution.

## 8. Bảo mật đã áp dụng

- Password dùng PBKDF2-SHA256 với salt riêng; refresh token chỉ lưu hash SHA-512, có rotation, revoke và reuse detection.
- Access/refresh token được giữ qua HttpOnly cookie ở BFF; frontend không ghi token vào localStorage/sessionStorage.
- Login và refresh có fixed-window rate limit; Production từ chối secret local/placeholder và chặn seed/reset mật khẩu demo ngay khi khởi động.
- Tạo order giới hạn 3 request/5 phút/IP; `Idempotency-Key` được lưu bền vững trong SQL để chống double-submit.
- Quote được ký HMAC và backend tính lại trong transaction tạo order; client không thể tự khai giá/khuyến mãi.
- Affiliate attribution đi qua BFF với proof ký HMAC trong HttpOnly cookie; payload order từ browser không được tin cậy.
- Export Excel chạy bằng durable background job, trả `202 Accepted`; không giữ request mở khi tạo workbook.
- Admin/Editor được kiểm soát bằng role policy; endpoint public chỉ trả dữ liệu cần thiết, không lộ internal note.
- Request tracking code dùng CSPRNG; input DTO có validation; EF Core query dùng parameterization.
- Audit không ghi password, token hoặc secret; chuyển trạng thái đơn hàng có transition hợp lệ.
- Public article render text, không đưa raw HTML chưa sanitize vào `dangerouslySetInnerHTML`.

Threat model và checklist QA nằm trong `docs/09-security-threat-model-and-qa.md`.

## 9. Kịch bản demo 10 phút

1. Mở landing và chứng minh dữ liệu catalog/blog/testimonial đến từ API.
2. Vào catalog, xem chi tiết gói, QR và thử pricing/compare/advisor.
3. Tạo order public, dùng tracking code kiểm tra trạng thái.
4. Đăng nhập Admin, mở dashboard, cập nhật trạng thái order; tạo export job, chờ `Completed` rồi tải workbook Excel.
5. Tạo/sửa plan hoặc promotion, kiểm tra audit log.
6. Duyệt một hồ sơ Affiliate, kiểm tra biên nhận tài khoản một lần và đăng nhập Partner Portal.
7. Mở tài khoản demo `affb`, kiểm tra huy hiệu Bạc, vòng avatar bạc, biểu đồ chuyển đổi, ledger đơn/hoa hồng và lịch sử payout.
8. Publish một bài blog bằng Markdown editor Write/Split/Preview, refresh public page và kiểm tra slug/search/category.
9. Mở Swagger, gọi health endpoint và kết luận bằng CI/build/test report.

Các số liệu uptime, khách hàng, chứng chỉ datacenter và doanh thu không được bịa. Nếu chưa có nguồn vận hành thật, giao diện ghi rõ đây là mục tiêu/chờ xác minh.

## 10. Tài liệu liên quan

- `docs/00`–`docs/07`: yêu cầu, contract, phân công và design system gốc.
- `docs/08-completed-system-and-demo.md`: acceptance matrix và mapping tính năng.
- `docs/09-security-threat-model-and-qa.md`: threat model, test matrix, release gate.
- `docs/10-team-contribution-template.md`: mẫu phân công và evidence để bốn thành viên điền bằng dữ liệu thật.
- `docs/13-dotnet10-enterprise-upgrade.md`: giải thích pattern, soft-delete/audit/concurrency/QR và runbook .NET 10.
- `docs/14-affiliate-outbox-idempotency-runbook.md`: Last-Click Affiliate 60 ngày, hold 30 ngày, Telegram Outbox, persistent idempotency và release gate.
- `docs/17-affiliate-portal-payout-runbook.md`: cấp tài khoản, tier, commission ledger, rút tiền, SMTP và kịch bản demo portal.
- `docs/18-final-architecture-review.md`: bản review cuối theo bằng chứng, khoảng trống còn lại và release gate.
- `docs/load-test-report.md`: protocol và mẫu report k6; chỉ điền metric sau khi chạy thật.
- `database/CloudServiceDb_v1.sql`: schema tham chiếu; migration trong Infrastructure là nguồn triển khai.
