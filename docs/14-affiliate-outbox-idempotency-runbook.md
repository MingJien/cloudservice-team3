# Affiliate, Outbox và Idempotency — Enterprise Runbook

Tài liệu này mô tả phần nâng cấp xuyên suốt Landing → Order → Admin trên .NET 10, Next.js 16.3 và React 19. Đây cũng là phần giải thích pattern có thể dùng trong báo cáo cuối môn.

## 1. Luồng Affiliate Last-Click 60 ngày, hold 30 ngày

### Danh tính hồ sơ và chống đăng ký trùng

`POST /api/affiliate-applications` chuẩn hóa email về chữ thường, điện thoại về 10 chữ số bắt đầu bằng `0`, và kênh về URL HTTPS canonical (host chữ thường, bỏ fragment/default port/dấu `/` cuối). Application pre-check để trả lỗi ngay theo từng field; ba unique index SQL Server mới là lớp bảo vệ cuối khi hai request chạy đua. Trùng dữ liệu trả `409 ValidationProblemDetails`, frontend giữ nguyên form và hiển thị lý do. Endpoint giới hạn 3 lần/10 phút/IP.

Một hồ sơ bị từ chối không được đăng ký bản sao. Admin/Editor dùng transition `Rejected → Processing` để mở lại hồ sơ cũ, giữ lịch sử và audit trong một identity duy nhất.

### Tra cứu trạng thái hồ sơ

Khi tạo hồ sơ, backend cấp `TrackingCode` ngẫu nhiên dạng `AFF-…`, lưu bằng unique index SQL Server và trả mã đó cho trình duyệt. `GET /api/affiliate-applications/tracking/{trackingCode}` được rate-limit 30 lần/5 phút/IP; phản hồi chỉ gồm `trackingCode`, `status`, mốc thời gian và `affiliateCode` khi trạng thái là `Done`. Email, điện thoại, nội dung kênh, ghi chú nội bộ và số liệu commission tuyệt đối không nằm trong projection public. Migration `AddAffiliateApplicationTracking` backfill mã ngẫu nhiên cho dữ liệu cũ trước khi áp dụng `NOT NULL` + unique index, nên deploy không vỡ với database đã có hồ sơ.

1. Đối tác chia sẻ URL `https://domain.example/?ref=KOL123`.
2. `AffiliateTracker` chuẩn hóa mã, tạo `VisitId` bằng `crypto.randomUUID()` và gọi BFF `POST /api/affiliate/referral`. BFF chỉ sau khi backend chấp nhận mới lưu proof, code và visit vào các cookie `HttpOnly`, `Secure` khi HTTPS, `SameSite=Lax` trong 60 ngày. Khi khách nhấn link khác, mã cuối cùng thay thế mã cũ theo Last-Click.
3. Checkout không đọc được credential Affiliate từ JavaScript. BFF `POST /api/orders` lấy bộ cookie HttpOnly và chuyển tiếp cùng request; backend vẫn kiểm chữ ký proof, partner, referral và thời hạn trong transaction.
4. Backend chỉ chấp nhận partner đang hoạt động. Trong cùng transaction tạo Order, hệ thống tạo `AffiliateAttribution` với snapshot mã, doanh thu, tỷ lệ và số hoa hồng.
5. Khi đơn chuyển `Done`, hoa hồng giữ `Pending` thêm 30 ngày để dành cửa sổ refund/gian lận; job idempotent mới chuyển `Pending → Eligible` khi đến hạn. Khi đơn `Rejected`, hoa hồng chuyển `Rejected`.

Snapshot giúp lịch sử đơn không bị thay đổi khi Admin sửa tỷ lệ hoa hồng của partner về sau. Unique index trên Order/Visit bảo vệ khỏi ghi nhận hai lần.

Demo local có partner `KOL123` và tài khoản Silver `affb`. Mở `http://localhost:3000/?ref=KOL123`, tạo đơn rồi kiểm tra attribution; dùng `affb / affb123` tại `/affiliate/login` để demo Partner Portal.

## 2. Transactional Outbox

Handler tạo đơn không gọi Telegram trực tiếp. Order, Affiliate attribution, idempotency response và `OutboxMessage` được commit trong một transaction SQL. Worker giành lease từng message, gửi Telegram bằng typed `HttpClient`, retry theo exponential backoff có jitter và đưa vào `DeadLetter` sau số lần lỗi tối đa.

Pattern này bảo đảm Telegram lỗi không làm khách hàng mất đơn. Cơ chế delivery là **at-least-once**; consumer bên ngoài nên dùng `OutboxMessage.Id` làm khóa deduplication nếu mở rộng sang broker.

### Cấu hình Telegram an toàn

Không ghi token thật vào `appsettings.json` hoặc Git. Tạo bot bằng `@BotFather`, thêm bot vào group, lấy `ChatId`, sau đó chạy tại thư mục repository:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\configure-local-secrets.ps1
```

Script hỏi token bằng `SecureString`, lưu user-secrets bên ngoài repository và tự bảo đảm JWT development secret tồn tại. Cấu hình này được cả Visual Studio F5 và `dotnet run` nạp lại ở những lần chạy sau. Có thể cấu hình thủ công tương đương:

```powershell
dotnet user-secrets --project backend/src/CloudService.WebApi/CloudService.WebApi.csproj set "Telegram:BotToken" "<BOT_TOKEN>"
dotnet user-secrets --project backend/src/CloudService.WebApi/CloudService.WebApi.csproj set "Telegram:ChatId" "<CHAT_ID>"
dotnet user-secrets --project backend/src/CloudService.WebApi/CloudService.WebApi.csproj set "Telegram:PublicBaseUrl" "https://your-public-domain.vn"
dotnet user-secrets --project backend/src/CloudService.WebApi/CloudService.WebApi.csproj set "Telegram:Enabled" "true"
```

Trên môi trường triển khai, dùng secret manager hoặc biến môi trường:

```text
Telegram__Enabled=true
Telegram__BotToken=<secret>
Telegram__ChatId=<secret>
Telegram__PublicBaseUrl=https://your-public-domain.vn
Telegram__MaskCustomerContact=true
```

Đơn mới (`OrderCreatedV2`) và cập nhật trạng thái mới (`OrderStatusChangedV2`) đều dùng `sendPhoto`: ảnh PNG là QR dẫn đến trang tra cứu đơn. Caption đơn mới có khách đã che thông tin, gói, chu kỳ, khuyến mãi, giá trị và việc cần làm. Caption trạng thái có snapshot gói/giá, luồng trạng thái, ghi chú vận hành, operator và trace. Hai nút inline mở trang tra cứu và trang quản trị. QR **không chứa email, điện thoại hoặc toàn bộ payload đơn**; đây là chủ đích giảm rò rỉ dữ liệu nếu ảnh bị chuyển tiếp. Event V1 cũ vẫn được hỗ trợ để xử lý backlog nhưng chỉ gửi text do payload cũ không đủ dữ liệu dựng phiếu V2.

`PublicBaseUrl` khi triển khai thật phải là HTTPS mà thiết bị mở Telegram truy cập được; QR trỏ `localhost` vẫn hiện nhưng điện thoại khác không thể mở máy phát triển. Khi Telegram bị tắt, API ghi warning rõ vào console và giữ message ở Outbox thay vì làm mất đơn. Bật lại worker sẽ xử lý backlog theo thứ tự; không nên xóa hàng đợi để che lỗi gửi.

`MaskCustomerContact=true` là mặc định an toàn: bot chỉ hiện email/số điện thoại đã che. Chỉ tắt khi nhóm Telegram là kênh vận hành riêng có kiểm soát truy cập và chính sách lưu giữ dữ liệu phù hợp.

### Hỏi đáp theo luồng

Nút **Hỏi tiếp về câu này** tạo một `ContactRequest` mới có mã tra cứu riêng và `ParentContactRequestId` trỏ đến câu hỏi gốc. Backend chỉ chấp nhận parent là câu hỏi gốc đã được trả lời; subject được lấy lại từ server để không giả mạo ngữ cảnh. Nhánh mới chỉ xuất hiện dưới câu hỏi gốc sau khi Admin/Editor phản hồi. Endpoint tạo liên hệ có rate limit riêng để giảm spam.

## 3. Idempotency bền vững

Frontend tạo một `Idempotency-Key` UUID cho một lần submit và giữ nguyên key khi retry cùng payload. Backend lưu SHA-256 của request và response thành công trong SQL:

- Cùng key + cùng payload: trả lại đúng response cũ, không tạo thêm Order.
- Cùng key + payload khác: trả `409 Conflict`.
- Nhiều instance hoặc restart: vẫn an toàn vì uniqueness nằm trong database, không nằm trong RAM.

Rate limit của endpoint tạo đơn là 3 request/5 phút/IP và được áp dụng sau `ForwardedHeaders`. Khi deploy sau reverse proxy, phải cấu hình `ReverseProxy:KnownProxies`; không tin tùy tiện `X-Forwarded-For` từ Internet.

## 3a. Export bất đồng bộ

`POST /api/order-requests/export` chỉ tạo `OrderExportJob` và trả `202 Accepted`. Worker DB-backed dùng lease + rowversion để một replica duy nhất dựng workbook; frontend poll trạng thái rồi tải từ endpoint download. File nằm trong SQL tối đa hai giờ ở bản demo; worker từ chối rõ ràng kết quả trên 5.000 dòng để không cắt báo cáo im lặng. Tenant lớn nên thay `varbinary(max)` bằng S3/MinIO và streaming, nhưng không đưa việc tạo file trở lại HTTP request.

## 4. Optimistic concurrency

`OrderRequest.RowVersion` được gửi về Admin dưới dạng Base64. Khi cập nhật trạng thái, frontend phải gửi lại version đã đọc. Nếu nhân viên khác đã sửa trước, EF Core phát hiện conflict; API trả `409` và giao diện tải bản mới thay vì ghi đè dữ liệu.

## 5. Zalo cá nhân

Điền số điện thoại đang đăng ký tài khoản Zalo vào `frontend/.env.local`:

```text
NEXT_PUBLIC_ZALO_PHONE=0901234567
```

Khởi động lại `npm.cmd run dev`. FAB chỉ xuất hiện khi cấu hình là 9–15 chữ số và mở tab mới tới `https://zalo.me/0901234567`, tức hồ sơ/chat cá nhân của số đó. Zalo có thể yêu cầu người dùng đăng nhập hoặc mở ứng dụng; website không thể bỏ qua bước bảo mật này.

## 6. Ranh giới thanh toán

Không cho phép nút frontend tự đổi đơn thành “đã thanh toán”. Phiên bản hiện tại chỉ tạo yêu cầu dịch vụ. VietQR và nút xác nhận tiền chỉ nên được bật sau khi có bounded context `PaymentTransaction`, chữ ký webhook, kiểm tra đúng số tiền/nội dung, chống replay và audit reconciliation. Khối QR/số tài khoản hardcode đã được loại bỏ để tránh tạo bằng chứng tài chính giả.

## 7. Release gate

```powershell
dotnet build backend/CloudService.sln --configuration Release --no-restore
dotnet test backend/CloudService.sln --configuration Release --no-restore

cd frontend
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
```

Migration `AddEnterpriseOrderAffiliateAndOutbox` tạo attribution/outbox; migration `AddPromotionMaxDiscountAndMinOrder` bổ sung giới hạn promotion và unique identity cho hồ sơ Affiliate. `Database:ApplyMigrationsOnStartup=true` chỉ phù hợp local/demo; production nên chạy migration trong deployment job riêng trước khi chuyển traffic.
