# PROMPT CHO CODEX - HOÀN THIỆN KHUNG BAN ĐẦU TRƯỚC KHI CHIA CODE

## Cách dùng

1. Giải nén `team-cloud-starter-v1.zip`.
2. Mở đúng thư mục `team-cloud-starter-v1` trong Codex.
3. Gửi toàn bộ prompt dưới đây.
4. Chưa `git init`, chưa commit và chưa push vì đang chờ repository của giảng viên.

---

Bạn là senior software architect phụ trách khởi tạo nền móng cho bài tập lớn môn Phát triển phần mềm hướng đối tượng. Hãy đọc toàn bộ `README.md`, `docs/` và `database/CloudServiceDb_v1.sql` trước khi sửa bất kỳ file nào.

Mục tiêu của lượt này là tạo **starter dùng chung có thể build/run**, để sau đó 4 thành viên tự làm module và có lịch sử commit/PR riêng. Không được làm thay API hoặc giao diện nghiệp vụ đã phân công cho TV2, Gói A và Gói B.

## 1. Công nghệ bắt buộc

- ASP.NET Core Web API controller-based, .NET 10.
- Clean Architecture: Domain, Application, Infrastructure, WebApi.
- SQL Server + EF Core 10 Code First/Migrations.
- Next.js App Router + TypeScript strict + Tailwind CSS.
- xUnit + Moq.
- OpenAPI + Swagger UI.
- Tên namespace thống nhất `CloudService.*`.

## 2. Việc được phép hoàn thiện trong nền móng

### Backend/domain/database

1. Tạo đầy đủ Domain entity và enum theo `docs/02-database-contract.md` và `database/CloudServiceDb_v1.sql`:
   - Role, AppUser, RefreshToken, AuditLog.
   - ServiceCategory, ServicePlan, PlanPrice, Promotion, PromotionServicePlan.
   - OrderRequest, AffiliateApplication.
   - NewsCategory, NewsArticle, Testimonial, ContactRequest.
2. Entity giữ logic/invariant cơ bản, không phụ thuộc EF Core hoặc ASP.NET Core.
3. Mỗi entity có một `IEntityTypeConfiguration<T>` riêng; mapping đúng độ dài, decimal, unique index, foreign key và check constraint.
4. Tạo `ApplicationDbContext`, design-time factory và dependency registration trong Infrastructure.
5. Tạo seed roles, service categories và dữ liệu public mẫu. Demo Admin/Editor phải được tạo bằng password hasher của ứng dụng; không ghi mật khẩu rõ hoặc hash giả trong SQL.
6. Nếu máy có .NET SDK 10 và entity đã khớp contract, tạo **duy nhất một** migration đầu `InitialCreate`. Nếu không chạy được thì không tự viết migration giả; báo rõ lệnh trưởng nhóm cần chạy.

### API dùng chung - chỉ nền móng

1. Giữ `/health`.
2. Cấu hình Controllers, ProblemDetails, validation pipeline cơ bản, CORS từ configuration.
3. Cấu hình OpenAPI/Swagger UI và Bearer JWT security scheme.
4. Tạo kiểu dùng chung `PagedRequest`, `PagedResult<T>` và chuẩn validation error.
5. Hoàn thiện API dùng chung do trưởng nhóm sở hữu: `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/change-password`; JWT Bearer, refresh-token rotation/revoke cơ bản, role Admin/Editor và password hash BCrypt/PBKDF2. Seed demo user bằng application seeder/password service, không ghi mật khẩu rõ trong source. Ghi tài khoản demo vào README bằng biến môi trường/hướng dẫn seed phù hợp.
6. Có audit log cho login thành công/thất bại hợp lý và đổi mật khẩu, nhưng không lưu mật khẩu/token hoặc secret vào log.
7. **Chưa tạo CRUD dịch vụ, order, affiliate, content, dashboard, pricing hoặc recommendation**.
8. Không tạo generic CRUD controller và không hard-code dữ liệu nghiệp vụ.

### Frontend dùng chung

1. Áp dụng đúng `docs/07-design-system-va-layout.md`.
2. Tạo design tokens, public layout (header/footer/container), admin shell (sidebar/topbar/content), và shared components cơ bản: Button, Input, Select, Card, Badge, Modal/Confirm, Table shell, Pagination, Loading, EmptyState, ErrorState.
3. Tạo API client đọc `NEXT_PUBLIC_API_BASE_URL`, chuẩn hóa xử lý lỗi; chưa viết API cụ thể của từng module.
4. Tạo route placeholder theo `docs/03-api-contract-v1.md`, nhưng không làm nội dung nghiệp vụ thay thành viên.
5. Mỗi landing section là component/file riêng để trưởng nhóm và người chọn Gói B không cùng sửa một file lớn.

### Tài liệu/chạy thử

1. Cập nhật README với yêu cầu môi trường và lệnh chạy backend/frontend/database.
2. Giữ `.env.example`, không ghi secret thật.
3. Chạy và sửa đến khi đạt:
   - `dotnet restore backend/CloudService.sln`
   - `dotnet build backend/CloudService.sln --no-restore`
   - `dotnet test backend/CloudService.sln --no-build`
   - `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm run build` trong frontend.
4. Nếu máy có SQL Server/SSMS hoặc Docker, chạy script trên database mới và xác nhận các bảng/seed. Không được xóa database đang có.

## 3. Những việc tuyệt đối chưa làm

- Không làm API CRUD hoặc UI hoàn chỉnh thuộc module TV2/Gói A/Gói B. Auth API là ngoại lệ vì thuộc trưởng nhóm và là hạ tầng dùng chung.
- Không triển khai pricing calculator, compare hoặc rule-based advisor; đó là phần code của trưởng nhóm ở PR riêng sau này.
- Không triển khai QR thanh toán, VNPay/MoMo, chatbot AI, email/SMS thật.
- Không thêm microservices, Redis, message queue, Kubernetes, CQRS/MediatR nếu chưa chứng minh cần thiết.
- Không đổi DB/API/status/design system đã chốt.
- Không `git init`, commit, push hoặc tạo repository.

## 4. Kết quả phải báo lại

1. Cây thư mục sau khi hoàn thiện.
2. Danh sách file tạo/sửa.
3. Package đã thêm và lý do.
4. Kết quả từng lệnh build/test/lint.
5. Migration/SQL đã được kiểm tra tới mức nào.
6. Các TODO còn lại theo đúng chủ module.
7. Đóng gói thành `team-cloud-starter-v2.zip`, loại bỏ `node_modules`, `.next`, `bin`, `obj`, `.env`, secret và file build tạm.

Nếu phát hiện tài liệu mâu thuẫn hoặc cần đổi schema/API, hãy dừng và hỏi; không tự quyết định mở rộng phạm vi.

---
