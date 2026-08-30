# Hướng dẫn đánh giá đồ án CloudService

## 1. Điểm bắt đầu

- Repository nộp bài: <https://github.com/MingJien/cloudservice-source>
- Nhánh dùng để chấm: [`main`](https://github.com/MingJien/cloudservice-source/tree/main)
- README: [../README.md](../README.md)
- Swagger sau khi chạy: `http://localhost:8080/swagger`

Repository `main` là bản tích hợp hoàn chỉnh. Các nhánh chức năng tách rời chỉ phục vụ quá trình tổ chức công việc; không cần dùng chúng để chạy hoặc chấm bài.

## 2. Cách chạy khuyến nghị

Yêu cầu: Docker Desktop đang chạy.

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Sau khi các container healthy:

| Thành phần | Địa chỉ |
|---|---|
| Public website | `http://localhost:3000` |
| Swagger/OpenAPI | `http://localhost:8080/swagger` |
| API health | `http://localhost:8080/health` |
| API readiness (bao gồm SQL Server) | `http://localhost:8080/health/ready` |

`.env` chỉ phục vụ local demo và nằm trong `.gitignore`. Không có secret production, certificate hoặc token thật trong repository.

## 3. Luồng demo nên kiểm tra

1. Mở trang chủ, catalog và bảng giá; kiểm tra dữ liệu dịch vụ, promotion và tin tức được gọi qua API.
2. Chọn gói, dùng pricing calculator/compare/advisor, tạo một order và lưu lại tracking code.
3. Tra cứu order bằng tracking code; xác nhận trang public không lộ internal note.
4. Đăng nhập Admin demo, chuyển trạng thái order, tạo export job và tải file Excel khi job hoàn thành.
5. Cập nhật giá/promotion hoặc nội dung; kiểm tra public data và audit log.
6. Tạo affiliate application, duyệt hồ sơ, sau đó xem Partner Portal và payout workflow.
7. Tạo/publish bài blog và kiểm tra search, category, paging cùng trang chi tiết public.

Thông tin account local demo và các cờ seed được nêu rõ trong [README](../README.md#4-chạy-nhanh-bằng-docker). Chúng chỉ dành cho môi trường demo.

## 4. Điểm kỹ thuật để đối chiếu

| Hạng mục | Vị trí kiểm tra |
|---|---|
| Clean Architecture | `backend/src/CloudService.{Domain,Application,Infrastructure,WebApi}` |
| API contract và Swagger | `docs/03-api-contract-v1.md`, `/swagger` |
| Pricing/compare/advisor | `Application/Features/Pricing`, `Recommendations` |
| Order, tracking, export | `Application/Features/Orders`, `OrderRequestsController` |
| Content, testimonial, contact | `Application/Features/Content`, `ContentController` |
| Affiliate, outbox, idempotency | `docs/14-affiliate-outbox-idempotency-runbook.md` |
| Security/QA | `docs/09-security-threat-model-and-qa.md` |
| Final architecture review | `docs/18-final-architecture-review.md` |

## 5. Kiểm thử và release gate

Các lệnh có thể chạy độc lập trên máy chấm:

```powershell
dotnet restore backend/CloudService.sln
dotnet build backend/CloudService.sln --no-restore
dotnet test backend/CloudService.sln --no-build

cd frontend
npm ci
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

Workflow GitHub Actions nằm tại `.github/workflows/main.yml`; workflow thực hiện backend build/test, frontend quality gate và smoke/E2E theo cấu hình repository. Kết quả chạy CI thực tế trên GitHub là bằng chứng release; không thay thế bằng số liệu tự khai.

## 6. Ranh giới demo

Dự án mô phỏng quy trình tư vấn, đặt dịch vụ và quản trị cloud. Không thực hiện thanh toán thật, provisioning VPS/domain thật, email/SMS production hoặc tích hợp bank webhook. Các giới hạn này được ghi trong [docs/06-pham-vi-chuc-nang-chot.md](06-pham-vi-chuc-nang-chot.md).
