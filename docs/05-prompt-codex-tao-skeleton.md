# PROMPT DÙNG CHO CODEX SAU KHI CÓ REPOSITORY

Sao chép toàn bộ prompt bên dưới vào Codex khi đang mở thư mục repository chính thức.

---

Bạn là senior .NET/Next.js engineer. Hãy khởi tạo **skeleton dùng chung** cho bài tập lớn Website bán dịch vụ Cloud của nhóm sinh viên năm 3. Chỉ dựng nền tảng có thể build/run; không làm thay các module nghiệp vụ đã giao cho thành viên.

## Bối cảnh bắt buộc

- Backend ASP.NET Core Web API .NET 10, controller-based API.
- Clean Architecture 4 tầng: Domain, Application, Infrastructure, WebApi.
- SQL Server + EF Core 10 Code First/Migrations.
- Frontend Next.js App Router + TypeScript + Tailwind CSS.
- JWT access/refresh, role Admin/Editor, password BCrypt/PBKDF2 sẽ được trưởng nhóm triển khai.
- OpenAPI + giao diện Swagger để mọi thành viên thử API.
- xUnit + Moq; GitHub Actions build/test; Dockerfile API và Docker Compose API + SQL Server sẽ do trưởng nhóm hoàn thiện.
- Database và API contract nằm trong `docs/02-database-contract.md`, `docs/03-api-contract-v1.md`. Không tự đổi tên bảng, route hay trạng thái.

## Việc phải làm

1. Kiểm tra trạng thái Git và đọc toàn bộ tài liệu trong `docs/` trước khi sửa.
2. Tạo/hoàn thiện `backend/CloudService.sln` gồm:
   - `src/CloudService.Domain`
   - `src/CloudService.Application`
   - `src/CloudService.Infrastructure`
   - `src/CloudService.WebApi`
   - `tests/CloudService.Domain.Tests`
   - `tests/CloudService.Application.Tests`
3. Dependency đúng chiều:
   - Domain không phụ thuộc project khác.
   - Application chỉ phụ thuộc Domain.
   - Infrastructure phụ thuộc Application và Domain.
   - WebApi phụ thuộc Application và Infrastructure.
4. Tạo folder feature tách biệt: `Auth`, `Services`, `Pricing`, `Recommendations`, `Orders`, `Affiliates`, `Content`, `Dashboard`, `AuditLogs`. Mỗi feature có vị trí cho Commands/Queries, DTOs, Validators, Interfaces; không tạo class rỗng hàng loạt nếu chưa cần.
5. Cấu hình controller, ProblemDetails, CORS lấy origin từ config, OpenAPI + Swagger UI, health endpoint `/health`. Swagger có Bearer JWT security scheme nhưng chưa cần viết toàn bộ auth.
6. Tạo Infrastructure folder cho Persistence, EntityConfigurations, Repositories, Authentication, QRCode, Excel, Logging. Chưa tạo migration nếu entity/config chưa được trưởng nhóm xác nhận.
7. Tạo frontend với `src/app`, `src/components`, `src/features`, `src/lib`. Có public layout, admin layout placeholder, API client đọc `NEXT_PUBLIC_API_BASE_URL`, không hard-code URL. Tạo folder feature tương ứng backend.
8. Tạo `.gitignore`, `.editorconfig`, `.env.example`; tuyệt đối không ghi secret thật.
9. Tạo một health controller/test mẫu để chứng minh skeleton build; không tạo CRUD giả hoặc hard-code nghiệp vụ.
10. Chạy và sửa đến khi đạt:
   - `dotnet restore backend/CloudService.sln`
   - `dotnet build backend/CloudService.sln --no-restore`
   - `dotnet test backend/CloudService.sln --no-build`
   - `npm install`, `npm run lint`, `npm run build` trong frontend.
11. Báo lại: cây thư mục, file đã tạo/sửa, lệnh đã chạy, kết quả build/test và việc còn TODO. Không commit/push nếu tôi chưa yêu cầu.

## Ràng buộc chống xung đột

- Không sửa hoặc xóa code ngoài phạm vi skeleton.
- Không đưa business logic của TV2/Gói A/Gói B vào shared layer.
- Không tạo generic repository quá mức hoặc đặt EF Core trong Domain.
- Không thêm package không cần thiết; mọi package phải tương thích `net10.0`.
- Không tạo migration nhiều lần. Migration đầu do trưởng nhóm thực hiện sau khi duyệt entity.
- Không dùng SQLite thay SQL Server trong code production.
- Giữ file nhỏ, tên rõ, namespace nhất quán `CloudService.*`.

Trước khi thay đổi, hãy đưa kế hoạch ngắn và nêu file dự kiến chạm tới. Nếu phát hiện tài liệu mâu thuẫn, dừng và hỏi thay vì tự đoán.

---

