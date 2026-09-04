# Affiliate Partner Portal và payout runbook

## 1. Quyết định nghiệp vụ

- Duyệt hồ sơ tạo một `AppUser` role `Affiliate`, username duy nhất và mật khẩu CSPRNG. Mật khẩu tạm chỉ xuất hiện trong receipt của lần duyệt và email; database chỉ giữ PBKDF2 hash.
- Lần đăng nhập đầu bắt buộc đổi mật khẩu. Admin/Editor là nhân sự vận hành; Affiliate là tài khoản đối tác độc lập.
- Last-Click cookie tồn tại 60 ngày. Commission snapshot tại thời điểm tạo đơn, được giữ 30 ngày sau khi đơn `Done` rồi mới thành `Eligible`.
- Một lệnh rút khóa toàn bộ commission đang khả dụng, tối thiểu 500.000đ. Chỉ một lệnh `Requested/Processing` được mở để ngăn double-spend.
- Admin thấy số tài khoản đầy đủ để chuyển tiền; API Partner Portal chỉ trả số đã che. `rowversion` ngăn hai Admin chốt cùng một payout.

## 2. Tier và tỷ lệ

Job chạy định kỳ, đánh giá theo số đơn hoàn tất của tháng trước:

| Tier | Điều kiện | Tỷ lệ |
|---|---:|---:|
| Newbie | 0–4 đơn/tháng | 5% |
| Bronze | 5–19 đơn/tháng | 7% |
| Silver | 20–49 đơn/tháng | 9% |
| Gold | từ 50 đơn/tháng | 12% |

Tỷ lệ được lưu snapshot trên attribution nên việc tăng/hạ rank không sửa lịch sử. Portal dùng viền avatar riêng theo tier, nhưng không biến rank thành role bảo mật.

## 3. Luồng payout

1. Partner gửi ngân hàng, số tài khoản và tên chủ tài khoản.
2. Application service khóa các attribution `Eligible` bằng `AffiliatePayoutId` trong cùng transaction.
3. Admin chuyển `Requested → Processing → Paid`, hoặc `Requested/Processing → Rejected` kèm lý do.
4. `Paid` chốt commission; `Rejected` giải phóng commission về ví. Mỗi transition có JSON audit và concurrency token.

Phiên bản đồ án mô phỏng bước chuyển khoản ngoài hệ thống. Production cần maker-checker, KYC/tax, encryption-at-rest cho tài khoản ngân hàng và webhook có chữ ký từ payout provider.

## 4. SMTP

Local mặc định `Smtp:Enabled=false`. Khi deploy, cấu hình secret:

```text
SMTP_ENABLED=true
SMTP_HOST=smtp.provider.example
SMTP_PORT=587
SMTP_ENABLE_SSL=true
SMTP_USERNAME=<secret>
SMTP_PASSWORD=<secret>
SMTP_FROM_EMAIL=partner@your-domain.vn
SMTP_FROM_NAME=MekongNode Partner Network
SMTP_PORTAL_URL=https://your-domain.vn/affiliate/login
```

Không rollback hồ sơ đã duyệt khi SMTP gián đoạn: tài khoản và partner đã là dữ liệu nội bộ hợp lệ. Receipt trả `Sent`, `Disabled` hoặc `Failed`; Admin phải bàn giao credential một lần qua kênh kiểm soát nếu email thất bại.

## 5. Dữ liệu demo kiểm chứng

- Login: `affb / affb123`.
- Hạng Silver/Bạc, imported click và conversion tháng được tách rõ khỏi ledger để không suy diễn tier từ lifetime revenue.
- Ledger có 15 đơn đã che PII, biểu đồ theo thời gian, Pending/Available/Paid và hai payout cũ trạng thái Paid.
- 15 dòng commission có khách đã che, phân trang; hai payout cũ trạng thái Paid.

Seeder idempotent: chạy lại không nhân đôi ledger. Dữ liệu này chỉ dành cho demo; production phải tắt seed và reset-password-on-startup.
