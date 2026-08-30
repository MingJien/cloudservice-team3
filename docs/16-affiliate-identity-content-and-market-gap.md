# Affiliate identity, Content demo và market-gap roadmap

Tài liệu này ghi lại quyết định của đợt nâng cấp ngày 23/08/2026. Mục tiêu là có bằng chứng kiểm tra được, không dùng tên thương hiệu lớn để suy ra rằng đồ án đã có hạ tầng hoặc chứng nhận tương đương.

## 1. Affiliate: một danh tính, một hồ sơ

| Field | Canonical form | Database guard | Phản hồi public |
|---|---|---|---|
| Email | trim + lowercase | `UQ_AffiliateApplications_Email` | `409`, lỗi tại `email` |
| Phone | chỉ chữ số, đúng 10 số, bắt đầu `0` | `UQ_AffiliateApplications_Phone` | `409`, lỗi tại `phone` |
| Website/channel | absolute HTTPS, host lowercase, bỏ fragment/default port/trailing slash | filtered unique index khi khác null | `409`, lỗi tại `websiteOrChannel` |

Pre-check trong Application nhằm phản hồi dễ hiểu. Unique index là nguồn đúng cuối cùng khi hai request cùng vượt qua pre-check. `ApplicationUnitOfWork` dịch lỗi SQL race-condition về cùng contract `ValidationProblemDetails`, nên frontend không phải đoán thông báo từ chuỗi lỗi database.

Website/channel vẫn là tùy chọn theo đề bài. Nếu người đăng ký cung cấp thì bắt buộc HTTPS và duy nhất. Hồ sơ `Rejected` được mở lại về `Processing`; không tạo bản sao để lách lịch sử từ chối.

## 2. RBAC đúng với đề bài

Admin và Editor là vai trò của nhân sự vận hành, **không phải phân hạng Affiliate**.

| Use case | Admin | Editor |
|---|---:|---:|
| Xem/tiếp nhận/duyệt/từ chối/mở lại Affiliate | Có | Có |
| Xử lý Order và Contact | Có | Có |
| Quản trị Blog/Category | Có | Có |
| Catalog, Price, Promotion, QR | Có | Không |
| Dashboard, Excel export, Audit log | Có | Không |
| Testimonial moderation | Có | Không |

Controller vẫn là lớp mỏng; transition Affiliate nằm tại Application service và thay đổi có audit.

## 3. Landing và About không trùng nhiệm vụ

- Landing phục vụ discovery/conversion: vấn đề khách hàng, cấu hình, giá API, gói nổi bật, KPI demo, CTA và social proof có ghi nguồn.
- `/about` phục vụ due diligence: bản chất đồ án, quyết định kiến trúc, timeline, bốn workstream, compliance roadmap và ranh giới giữa target/reference/certification.
- ISO 27001/SOC 2/10Gbps/SLA hiện được ghi là tham chiếu hoặc mục tiêu. Chỉ đổi thành chứng nhận/cam kết sau khi có tài liệu và telemetry thật.

## 4. Dữ liệu Blog có thể trình diễn nhưng không giả khách hàng

Seeder idempotent nâng hai bản ghi demo cũ thành bài hoàn chỉnh:

1. `checklist-trien-khai-vps`: 12 bước SSH/firewall/backup/health/rollback; ảnh `/images/blog/vps-deployment-checklist.png`.
2. `chon-chu-ky-gia-cloud`: phân tích TCO, workload, promotion guard và ba kịch bản chu kỳ; ảnh `/images/blog/cloud-pricing-cycle.png`.

Seeder chỉ nâng bản demo ngắn do `MekongNode Engineering` tạo. Sau khi Editor đã biên tập nội dung dài, startup không ghi đè hoặc tự publish lại.

## 5. Đối chiếu Vietnix và reference UI

Khảo sát public page cho thấy Vietnix tổ chức theo nhóm Hosting/VPS/Cloud/Domain/Email/SSL/Firewall, công khai bảng giá/khuyến mãi, nội dung hướng dẫn, FAQ, chính sách hoàn tiền/gia hạn và chương trình Affiliate có link tracking. Đây là nguồn tham khảo cho cấu trúc thông tin, không phải dữ liệu để sao chép: [Vietnix](https://vietnix.vn/), [Affiliate Vietnix](https://vietnix.vn/affiliate/).

Reference Celestial/Nimbus dùng hero hai cột, trust strip bốn chỉ số, feature card, testimonial, pricing và CTA; MekongNode chỉ mượn nguyên tắc phân cấp/whitespace, giữ màu, copy và component riêng: [Celestial Cloud Haven](https://celestial-cloud-haven.lovable.app/#features).

### Khoảng trống nên phát triển theo bounded context

| Ưu tiên | Chức năng | Vì sao cần | Điều kiện để không làm giả |
|---|---|---|---|
| P0 đã có | Catalog + price hiệu lực + compare/advisor + order tracking + Affiliate attribution + Blog/Q&A | Đủ luồng public → API → Admin của đề bài | Dữ liệu demo có nhãn; invariant ở backend |
| P1 | Customer portal: tài khoản, danh sách dịch vụ, lịch gia hạn, thông báo trước hạn | Web bán thật cần vòng đời sau đơn | Không gọi là “đã cấp VPS” khi chưa có provisioning provider |
| P1 | Payment bounded context + invoice + webhook reconciliation | Chuyển yêu cầu thành giao dịch có đối soát | Chữ ký webhook, chống replay, idempotency, trạng thái riêng; không dùng QR hard-code |
| P1 | Ticket/support SLA và escalation | Tách hỏi đáp công khai khỏi hỗ trợ khách đã mua | SLA chỉ công bố khi đo được response time |
| P2 | Provisioning adapter cho VPS/Hosting/Domain | Tự động cấp/thu hồi tài nguyên | Sandbox provider, saga/compensation và audit; không điều khiển hạ tầng bằng Controller |
| P2 | Backup/restore job, monitoring và usage metering | Bằng chứng vận hành và billing usage | Telemetry thật, retention, alert ownership và load test |
| P0 đã có | Partner portal: click/conversion/commission/payout statement | Affiliate bán thật cần tự đối soát | Commission khóa theo payout, rowversion, mask PII và Admin-only bank details |
| P1 | KYC/tax document và payout provider webhook | Đưa đối soát thủ công thành thanh toán production | Mã hóa tài liệu, retention, chữ ký webhook, reconciliation và maker-checker |

Không nên cố nhồi toàn bộ P1/P2 vào đồ án nếu không có test và demo end-to-end. Chất lượng được đo bằng invariant, failure path và evidence, không bằng số menu.

## 6. Acceptance evidence của đợt nâng cấp

- SQL migration `AddPromotionMaxDiscountAndMinOrder` đã áp dụng vào database local.
- POST hồ sơ trùng cả ba field trả HTTP `409` và ba lỗi field-level; frontend hiển thị ngay, không tạo bản ghi mới.
- API health/readiness đều `Healthy`; API trả hai bài seed và thumbnail local.
- Build backend .NET 10 không warning/error; 63/63 test pass.
- Frontend ESLint, TypeScript và Next production build 37 route đều pass.
