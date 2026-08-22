# CloudService — .NET 10 enterprise upgrade

Ngày xác nhận: **2026-08-21**. Tài liệu này mô tả phần nâng cấp backend/frontend và là runbook ngắn để nhóm đưa vào báo cáo, demo, phản biện.

## 1. Baseline kỹ thuật đã chốt

- Toàn bộ project backend dùng `net10.0`; `global.json` khóa SDK 10.0.1xx; EF Core, JWT bearer và EF Design dùng `10.0.10`.
- Docker API dùng SDK/ASP.NET runtime 10; GitHub Actions cài SDK `10.0.x`.
- Clean Architecture giữ đúng chiều phụ thuộc: Domain → Application ports/use cases → Infrastructure adapters → WebApi.
- Release build: `0 warning / 0 error`; xUnit: `39/39`; frontend ESLint, TypeScript strict và Next production build đều đạt.

## 2. Pattern và lý do áp dụng

### Soft Delete + Global Query Filter

`ISoftDelete` đặt tại Domain và được áp dụng cho danh mục, gói, bảng giá, bài viết. `ApplicationDbContext` tự gắn query filter `IsDeleted == false`, nên use case thông thường không vô tình trả dữ liệu đã tắt. Admin chủ động dùng `IgnoreQueryFilters()` tại đúng read model cần xem/khôi phục. API Delete chỉ đổi trạng thái; Restore mở lại bản ghi.

Lợi ích báo cáo: bảo toàn lịch sử và khóa ngoại, giảm rủi ro xóa nhầm. Đơn hàng luôn đọc giá lịch sử bằng truy vấn bỏ filter có kiểm soát vì đơn là commercial snapshot.

### Repository + Unit of Work

Application chỉ phụ thuộc interface repository/UoW; EF Core nằm ở Infrastructure. Use case quản lý invariant và transaction boundary, controller chỉ chuyển HTTP request/response. Cách này hỗ trợ Dependency Inversion và test Application bằng mock.

### SaveChangesInterceptor cho Audit

`AuditSaveChangesInterceptor` quan sát Added/Modified/Deleted của `PlanPrice`, `Promotion`, `ServicePlan` ngay tại persistence boundary. Log lưu `UserId`, IP, action, entity, old/new values trong cùng transaction với thay đổi nghiệp vụ. Vì audit là cross-cutting concern, interceptor tránh lặp code và tránh bỏ sót khi có use case mới.

`AuditLogRetentionService` tính lần chạy kế tiếp lúc 02:00 theo giờ máy chủ và xóa log quá 6 tháng bằng bulk delete. Retention là cấu hình, không hard-code trong UI.

### Factory cho mã đơn

`OrderRequestFactory` vừa tạo aggregate vừa cấp mã `ORD-` + 10 ký tự bằng CSPRNG, loại ký tự dễ nhầm và kiểm tra collision trong repository. Factory gom quy tắc khởi tạo phức tạp về một nơi; controller/service không tự ghép mã bằng timestamp tuần tự, khó đoán.

### Strategy cho khuyến mãi

Percentage và Fixed Amount là các strategy độc lập. Pricing service chọn implementation theo `DiscountType`; thêm loại giảm giá mới không sửa thuật toán cũ, phù hợp Open/Closed Principle.

### Optimistic Concurrency

`PlanPrice` và `Promotion` có SQL `rowversion`; frontend gửi lại token khi sửa. EF phát hiện bản ghi đã bị admin khác cập nhật và API trả HTTP 409, yêu cầu tải dữ liệu mới thay vì silently overwrite.

### Adapter/Provider cho QR

Application phụ thuộc `IQrCodeGenerator`; QRCoder chỉ nằm ở Infrastructure. `GET /api/serviceplans/{id}/qr` tạo PNG trong memory chứa `/order?planId={id}`, không ghi file QR lên disk. Vì vậy QR luôn đúng URL hiện tại và không tạo rác.

## 3. Luồng upload logo

1. WebApi kiểm tra kích thước, extension và magic bytes của PNG/JPEG/GIF/WebP.
2. Ghi file mới với tên ngẫu nhiên.
3. Cập nhật setting trong database.
4. Chỉ sau khi DB commit thành công mới xóa file logo cũ; nếu commit lỗi thì xóa file mới để rollback.
5. Frontend cập nhật `BrandProvider` và phát sự kiện `cloudservice:branding-updated`, nên Header/Landing đổi ngay không cần F5.

Thứ tự này tránh trường hợp xóa logo cũ trước rồi DB update thất bại.

## 4. Soft-delete và UI quản trị

| Module | Tắt | Khôi phục | Lưu ý |
|---|---|---|---|
| Category | `DELETE /api/service-categories/{id}` | `PATCH .../{id}/restore` | UI gọi `disable-impact`, cảnh báo số gói bị ẩn ngoài landing |
| ServicePlan | `DELETE /api/service-plans/{id}` | `PATCH .../{id}/restore` | Gói đã tắt chỉ hiện nút khôi phục |
| PlanPrice | `DELETE /api/plan-prices/{id}` | `PATCH .../{id}/restore` | Giá đã tắt không tham gia quote/order |
| NewsArticle | `DELETE /api/news-articles/{id}` | `PATCH .../{id}/restore` | Khôi phục về Draft để admin duyệt trước khi publish lại |

Admin có filter `Đang hoạt động / Đã tắt`. Landing/public API chỉ trả parent/child/price còn hoạt động; khôi phục không tự publish bài viết để tránh phát nội dung chưa kiểm duyệt.

## 5. Giá, khuyến mãi và đặt hàng

- Form bảng giá nhập giá gốc + phần trăm giảm trực tiếp; giá hiệu lực là read-only và được tính tức thời. Backend vẫn là nguồn xác thực cuối.
- Chu kỳ dùng shared label/color map ở Admin và Landing. Chu kỳ không có giá đang bán vẫn hiện trong dropdown nhưng bị disabled và ghi `— chưa bán`.
- Pricing truyền `servicePlanId`, không nhầm với `planPriceId`; kết quả trả cả hai ID để đối chiếu.
- Public promotions API chỉ trả promotion đang active, nằm trong thời gian áp dụng và chưa hết usage limit.
- Đặt hàng lưu snapshot tên gói, chu kỳ, giá/khuyến mãi; trả mã tracking lớn, sau đó tra cứu timeline `New → Processing → Done/Rejected`.
- Admin từ chối bắt buộc có lý do. Những terminal transition không hợp lệ bị backend chặn.

## 6. Seed và dữ liệu demo

Migration có dữ liệu catalog nhiều hơn mức tối thiểu 3 danh mục/5 gói. Runtime seeder idempotent tạo Admin, Editor, nội dung demo và `FLASH20` nếu chưa có. Production fail-fast nếu còn bật demo users/reset password hoặc dùng JWT secret local; mật khẩu demo không được dùng ngoài Development.

## 7. Chạy bằng Visual Studio và VS Code

Visual Studio 2026/phiên bản hỗ trợ .NET 10:

1. Mở `backend/CloudService.sln`.
2. Chọn `CloudService.WebApi` làm Startup Project.
3. Đảm bảo SDK 10 xuất hiện qua `dotnet --list-sdks`.
4. Stop tiến trình F5 cũ nếu đang giữ DLL, chọn **Rebuild Solution**, sau đó F5.
5. Kiểm tra `http://localhost:8080/health` và `http://localhost:8080/health/ready`.

VS Code frontend:

```powershell
cd frontend
npm.cmd run dev
```

Mở `http://localhost:3000`. `.env.local` phải trỏ backend/BFF tới `http://localhost:8080`.

## 8. Release gate đã chạy

```text
dotnet build backend/CloudService.sln --configuration Release  PASS, net10.0, 0 warning/error
dotnet test backend/CloudService.sln -c Release --no-build     PASS, 39/39
frontend: npm run lint                                         PASS
frontend: npx tsc --noEmit                                     PASS
frontend: npm run build                                        PASS, 36 routes
runtime migration/startup                                      PASS
GET /health                                                    Healthy
GET /api/serviceplans/1/qr                                     image/png, valid PNG signature
POST + GET tracking                                            ORD-XXXXXXXXXX, matched
category soft-delete + restore                                 PASS
browser landing/dark/countdown/pricing                         PASS, no console warning/error
```

## 9. Câu trả lời phản biện ngắn

- **Vì sao không hard delete?** Catalog/content có quan hệ lịch sử; soft delete an toàn và có restore/audit.
- **Vì sao cần rowversion?** Hai admin sửa cùng lúc phải báo conflict, không được ghi đè âm thầm.
- **Vì sao audit ở interceptor?** Đây là concern xuyên suốt persistence, cần bao phủ mọi use case trong cùng transaction.
- **Vì sao QR không lưu file?** QR chỉ là biểu diễn của URL; sinh động giảm rác và tránh QR hết hạn theo domain cũ.
- **Vì sao tracking không dùng ID?** ID tuần tự dễ đoán và lộ quy mô; CSPRNG code phù hợp tra cứu public.
- **Factory/Strategy có phải trang trí?** Không: Factory cô lập quy tắc tạo order/code; Strategy cô lập thuật toán giảm giá có khả năng mở rộng độc lập.
