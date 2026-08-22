# CloudService — final audit & traceability

Ngày rà soát: **2026-08-21**. Mọi thay đổi trong vòng rà soát này nằm trong thư mục `CloudService`.

Tài liệu này đối chiếu `de-bai-tap-lon-cuoi-ky.pdf`, phân công/contract trong `team-cloud-starter-v2/docs` và nội dung `BaiGiang`. Kết luận chỉ dựa trên bằng chứng có thể kiểm tra; không tự tạo lịch sử Git, PR, coverage hoặc số liệu demo.

## 1. Kết luận điều hành

- **Bốn phần code của bốn thành viên đã hoàn thành và tích hợp end-to-end**: nền tảng/auth, catalog/pricing/QR, order/affiliate/dashboard/export, public/content/admin.
- Backend .NET 10 build Release `0 warning / 0 error`; **39/39 test** xanh và đã sinh báo cáo Cobertura thật.
- Frontend lint, TypeScript strict và production build đều xanh; Next.js sinh **36 trang/route**.
- F5-equivalent bằng đúng tài khoản Windows đã kết nối SQL Server `MSI\MCHIENCS`, migration/seed thành công; liveness, readiness, catalog, Swagger và OpenAPI đều HTTP 200.
- Landing page đã dùng `hero-bg.png`, bố cục hai cột, mesh/glass/glow, typography Be Vietnam Pro, scroll reveal và reduced-motion fallback; QA thật ở 1280 px và 390 px không tràn ngang, không lỗi console, không lỗi mã hóa tiếng Việt.
- **Hồ sơ nộp bài chưa thể gọi là hoàn tất 100%** nếu chưa có 10 PR thật, commit/review đồng đều của 4 thành viên, báo cáo PDF 15–25 trang và slide/demo. Đây là bằng chứng con người/nhóm phải cung cấp, không được giả lập bằng AI.

## 2. Bốn gói công việc

| Phần | Bằng chứng trong `CloudService` | Trạng thái |
|---|---|---|
| TV1 — nền tảng | Clean Architecture 4 lớp, DI, EF Core, JWT/refresh rotation, PBKDF2, RBAC, audit, BFF cookie, CI/Docker/runbook | Hoàn thành code |
| TV2 — catalog | Category/plan/price/promotion CRUD, pricing/compare, QR, seed, public catalog, admin catalog, audit | Hoàn thành code |
| Gói A — vận hành | Order + tracking + workflow, affiliate, dashboard KPI/chart, Excel `.xlsx`, admin operations | Hoàn thành code |
| Gói B — public/content | Landing, about/datacenter/SLA, services, blog, testimonial, contact, admin content | Hoàn thành code |

## 3. Ma trận yêu cầu đề bài

| Yêu cầu | Bằng chứng | Đánh giá |
|---|---|---|
| ASP.NET Core controller API | `backend/src/CloudService.WebApi/Controllers`, `Program.cs` | Có |
| Clean Architecture 4 lớp | `Domain`, `Application`, `Infrastructure`, `WebApi`; dependency hướng vào trong | Có |
| SOLID + ít nhất 3 pattern | Repository/Unit of Work, Strategy, Adapter/Formatter, Factory/Provider, BFF facade | Có; báo cáo phải giải thích trade-off |
| EF Core + SQL Server | `ApplicationDbContext`, configurations, migrations, SQL contract | Có |
| REST/DTO/paging/filter/sort/ProblemDetails | Controller + request/response models + paging metadata + exception handler | Có |
| JWT/refresh/Admin/Editor | Auth service/controller, rotation/revoke/reuse detection, role authorization | Có |
| Password hash | `Pbkdf2PasswordHasher`, salt riêng | Có |
| Public pages | Bộ route public cùng landing data-driven | Có |
| Catalog/pricing/compare/advisor/QR | Features và public UI tương ứng | Có |
| Order/tracking/affiliate/contact | API, database, public form và admin workflow | Có |
| Blog/testimonial | CRUD, publish, list/detail/search/category/paging | Có |
| Dashboard + chart | KPI, status, monthly series, top plans | Có |
| Excel export | `OrderXlsxExportFormatter` + endpoint/nút download | Có |
| Ít nhất 15 unit test + coverage | 39 test; `coverlet.collector`; `coverage.runsettings`; CI upload Cobertura | Có |
| CI/CD | `.github/workflows/ci.yml` build/test/coverage/lint/build | Có config; cần URL run xanh thật |
| Docker API + SQL Server | multi-stage Dockerfile, compose DB/API/frontend, readiness gate | Có config; cần chạy lại khi Docker Desktop hoạt động |
| Git teamwork | `docs/10-team-contribution-template.md` | Chưa thể xác minh PR/commit thật từ gói file hiện tại |
| Báo cáo/slide/demo | docs runbook + traceability | Chưa thay thế báo cáo PDF 15–25 trang và slide nộp bài |

## 4. Đối chiếu với bài giảng

| Chủ đề giảng viên | Cách áp dụng/giới hạn |
|---|---|
| SOLID, KISS, YAGNI | Use case tách theo feature/interface; không bổ sung payment/provisioning/AI ngoài phạm vi |
| Clean Architecture | Domain không phụ thuộc framework; Application giữ port/use case; Infrastructure cài persistence/security/export; WebApi orchestration HTTP |
| Patterns | Mỗi pattern có nhu cầu thay đổi/kiểm thử cụ thể, không dùng pattern để trang trí |
| EF Core/Dapper | EF Core cho CRUD/migration, `AsNoTracking` cho read, query parameterized, paging; chưa dùng Dapper vì chưa có benchmark chứng minh cần |
| REST | Noun routes, verb/status đúng, DTO, ProblemDetails, Swagger/OpenAPI; API contract được ghi là v1 nhưng URL chưa prefix `/api/v1` |
| Security | PBKDF2, JWT ngắn hạn, refresh hash/rotation, cookie HttpOnly, rate limit, RBAC, audit không ghi secret; Production fail-fast nếu dùng secret/seed demo |
| Testing | AAA/FIRST, happy/edge/invariant, 39 test và Cobertura; coverage là chỉ báo chứ không thay thế chất lượng test |
| Git/CI/Docker | Small-commit/PR rules trong docs; CI fail fast; Docker multi-stage; compose có DB health và API readiness |
| Vận hành | Liveness `/health`, readiness DB `/health/ready`, logging console/debug, env secret, runbook/rollback boundary |

## 5. Release checks thực tế ngày 2026-08-20

```text
dotnet restore backend/CloudService.sln                         PASS
dotnet build backend/CloudService.sln -c Release --no-restore  PASS (0 warning, 0 error)
dotnet test ... --collect:"XPlat Code Coverage"                PASS (36/36 + 2 Cobertura files)
frontend: npm run lint                                         PASS
frontend: npx tsc --noEmit                                     PASS
frontend: npm run build                                        PASS (36 pages/routes)
frontend: npm audit --audit-level=high                         PASS (0 vulnerabilities)
docker compose config --quiet                                  PASS
```

Coverage hiện tại sau khi lọc đúng Domain/Application:

| Test suite | Line | Branch | Ghi chú |
|---|---:|---:|---|
| Domain | 39,56% | 27,17% | 12 test |
| Application | 38,23% | 18,58% | 24 test; report có cả Domain được tham chiếu |

Coverage đã đáp ứng yêu cầu “có báo cáo” nhưng chưa phải mức cao. Nếu còn thời gian, ưu tiên test cho validation/status transitions/content/order edge cases thay vì viết test chỉ để tăng phần trăm.

Smoke test bằng đúng tài khoản Windows như khi bấm F5:

```text
SQL Server MSI\MCHIENCS                                      CONNECTED
EF Core migration                                            DATABASE UP TO DATE
GET /health                                                  200
GET /health/ready                                            200 (database Connected)
GET /api/service-categories                                  200
GET /api/service-plans                                       200 (6 plans)
GET /swagger/index.html                                      200
GET /openapi/v1.json                                         200
POST /api/pricing/quotes                                     200 (Cloud VPS Basic = 490.000)
POST /api/service-plan-recommendations                       200 (3 results)
POST /api/auth/login                                         200 (Admin, access + refresh issued)
GET /api/dashboard/summary without token                     401
POST invalid pricing request                                 400 application/problem+json
Production + local JWT/demo config                           FAIL FAST as designed
```

UI acceptance:

```text
Desktop 1280 px                                              PASS
Mobile 390 x 844                                             PASS
Horizontal overflow                                          NONE
Browser console error/warning                                NONE
Frontend API error state after backend ready                 NONE
Vietnamese mojibake patterns                                 NONE
Real hero image request                                      /hero-bg.png via next/image
Reduced-motion preference                                    RESPECTED
```

Docker Desktop engine không chạy trong lần rà soát này nên chỉ `docker compose config` được xác nhận lại. Trước khi quay demo phải chạy `docker compose up -d --build --wait` và lưu log/ảnh thật.

## 6. Sai khác có chủ đích và rủi ro chấm điểm

1. **Target framework đã được chuẩn hóa thành .NET 10 theo yêu cầu chốt của dự án.** Solution, EF/JWT packages, Docker và CI dùng cùng major version; không còn target .NET 8/9 trong cấu hình đang chạy.
2. API có contract v1/OpenAPI nhưng route chưa prefix `/api/v1`. Đây là khuyến nghị trong bài giảng, không phải mục bắt buộc ghi trong rubric; nếu đổi cần versioning strategy và migration client, không nên đổi sát ngày demo.
3. Serilog và deploy cloud là khuyến khích/điểm cộng. Hiện có structured console/debug logging nhưng chưa có URL deploy, retention/monitoring hoặc Serilog sink được xác nhận.

## 7. Việc nhóm phải chốt trước khi nộp

1. Tạo/push GitHub repository thật, feature branch cho từng thành viên, tối thiểu 10 PR có reviewer khác tác giả; điền URL/commit/PR vào `docs/10-team-contribution-template.md`.
2. Chạy GitHub Actions xanh và tải artifact `backend-coverage-cobertura`; chụp màn hình job, không dùng ảnh giả.
3. Chạy full Docker stack từ máy sạch/database trống; lưu `docker compose ps`, health/readiness và luồng demo.
4. Viết báo cáo PDF 15–25 trang: kiến trúc, SOLID/pattern kèm lý do, ERD/API, security, UI, test/coverage, CI/Docker, phân công và giới hạn.
5. Hoàn thiện slide + demo 15 phút, tập kịch bản trong `docs/08-completed-system-and-demo.md`; chuẩn bị fallback video/log khi mạng hoặc Docker lỗi.
6. Chỉ công bố SLA, uptime, khách hàng, chứng chỉ và doanh thu khi có nguồn; dữ liệu seed phải ghi rõ là demo.

## 8. Demo acceptance flow

1. Mở `/`, `/services`, `/pricing`, `/compare`, `/advisor`; chứng minh loading/error/empty và data API.
2. Xem service detail, đổi chu kỳ, promotion, compare và QR.
3. Tạo order, lưu tracking code và tra cứu trạng thái.
4. Đăng nhập Admin; xem dashboard 3/6/12/24 tháng, KPI, donut, monthly series, top plans.
5. Chuyển `New → Processing → Done` hoặc `Rejected`; thử transition sai và xem ProblemDetails/audit.
6. Export `.xlsx`, mở bằng Excel/LibreOffice, kiểm tra tiếng Việt và giá.
7. CRUD category/plan/price/promotion; xác nhận public catalog/quote đổi theo.
8. Publish/unpublish article; kiểm tra blog search/category/paging/detail.
9. Xử lý affiliate/contact; chứng minh Editor bị chặn endpoint Admin-only.
10. Kết thúc bằng Swagger, health/readiness, coverage artifact và CI xanh.
