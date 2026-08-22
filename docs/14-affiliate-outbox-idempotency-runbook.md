# Affiliate, Outbox và Idempotency — Enterprise Runbook

Tài liệu này mô tả phần nâng cấp xuyên suốt Landing → Order → Admin trên .NET 10, Next.js 16.3 và React 19. Đây cũng là phần giải thích pattern có thể dùng trong báo cáo cuối môn.

## 1. Luồng Affiliate có attribution 30 ngày

1. Đối tác chia sẻ URL `https://domain.example/?ref=KOL123`.
2. `AffiliateTracker` chuẩn hóa mã, tạo `VisitId` bằng `crypto.randomUUID()`, lưu cookie `SameSite=Lax` trong 30 ngày và gọi `POST /api/affiliate-referrals`.
3. Checkout đọc `AffiliateCode` và `AffiliateVisitId` từ cookie rồi gửi cùng `CreateOrderRequest`.
4. Backend chỉ chấp nhận partner đang hoạt động. Trong cùng transaction tạo Order, hệ thống tạo `AffiliateAttribution` với snapshot mã, doanh thu, tỷ lệ và số hoa hồng.
5. Khi đơn chuyển `Done`, hoa hồng chuyển `Pending → Eligible`; khi đơn `Rejected`, hoa hồng chuyển `Rejected`.

Snapshot giúp lịch sử đơn không bị thay đổi khi Admin sửa tỷ lệ hoa hồng của partner về sau. Unique index trên Order/Visit bảo vệ khỏi ghi nhận hai lần.

Demo local có partner `KOL123` với tỷ lệ 10%. Mở `http://localhost:3000/?ref=KOL123`, tạo đơn rồi kiểm tra cột attribution trong Admin.

## 2. Transactional Outbox

Handler tạo đơn không gọi Telegram trực tiếp. Order, Affiliate attribution, idempotency response và `OutboxMessage` được commit trong một transaction SQL. Worker giành lease từng message, gửi Telegram bằng typed `HttpClient`, retry theo exponential backoff có jitter và đưa vào `DeadLetter` sau số lần lỗi tối đa.

Pattern này bảo đảm Telegram lỗi không làm khách hàng mất đơn. Cơ chế delivery là **at-least-once**; consumer bên ngoài nên dùng `OutboxMessage.Id` làm khóa deduplication nếu mở rộng sang broker.

### Cấu hình Telegram an toàn

Không ghi token thật vào `appsettings.json` hoặc Git. Tạo bot bằng `@BotFather`, thêm bot vào group, lấy `ChatId`, sau đó chạy tại thư mục repository:

```powershell
dotnet user-secrets --project backend/src/CloudService.WebApi/CloudService.WebApi.csproj set "Telegram:BotToken" "<BOT_TOKEN>"
dotnet user-secrets --project backend/src/CloudService.WebApi/CloudService.WebApi.csproj set "Telegram:ChatId" "<CHAT_ID>"
dotnet user-secrets --project backend/src/CloudService.WebApi/CloudService.WebApi.csproj set "Telegram:Enabled" "true"
```

Trên môi trường triển khai, dùng secret manager hoặc biến môi trường:

```text
Telegram__Enabled=true
Telegram__BotToken=<secret>
Telegram__ChatId=<secret>
```

## 3. Idempotency bền vững

Frontend tạo một `Idempotency-Key` UUID cho một lần submit và giữ nguyên key khi retry cùng payload. Backend lưu SHA-256 của request và response thành công trong SQL:

- Cùng key + cùng payload: trả lại đúng response cũ, không tạo thêm Order.
- Cùng key + payload khác: trả `409 Conflict`.
- Nhiều instance hoặc restart: vẫn an toàn vì uniqueness nằm trong database, không nằm trong RAM.

Rate limit của endpoint tạo đơn là 3 request/5 phút/IP và được áp dụng sau `ForwardedHeaders`. Khi deploy sau reverse proxy, phải cấu hình `ReverseProxy:KnownProxies`; không tin tùy tiện `X-Forwarded-For` từ Internet.

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

Migration `AddEnterpriseOrderAffiliateAndOutbox` là nguồn thay đổi schema. `Database:ApplyMigrationsOnStartup=true` chỉ phù hợp local/demo; production nên chạy migration trong deployment job riêng trước khi chuyển traffic.
