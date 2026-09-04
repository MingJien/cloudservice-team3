# PHẠM VI CHỨC NĂNG ĐÃ CHỐT

## 1. Bắt buộc theo đề

### Public

1. Trang chủ: hero, gói nổi bật, promotion đang chạy, uptime, tin mới.
2. Giới thiệu: lịch sử, datacenter, chứng chỉ/SLA/uptime.
3. Dịch vụ: VPS, Hosting, Domain, Email doanh nghiệp, SSL, Firewall chống DDoS; mô tả và thông số.
4. Bảng giá: tháng/năm, cấu hình, promotion có thời hạn, nút đặt gói.
5. Khách hàng: testimonial/logo và QR từng gói.
6. Blog: list/detail, paging, search, category.
7. Liên hệ/đặt dịch vụ: chọn gói/chu kỳ, thông tin khách hàng, lưu DB.
8. Affiliate: chính sách và form đăng ký.

### Admin

1. Login, refresh token, đổi mật khẩu; role Admin/Editor.
2. CRUD category, plan, price, promotion; cập nhật ra public.
3. Sinh/sinh lại QR dẫn tới detail/order page của gói.
4. CRUD blog bằng Markdown hoặc rich text.
5. Quản lý order/affiliate: New -> Processing -> Done/Rejected.
6. Dashboard theo tháng và gói được quan tâm.
7. Xuất order requests ra Excel.
8. Audit log cho login và thay đổi giá/nội dung quan trọng.

### Kỹ thuật

- Clean Architecture, SOLID, tối thiểu 3 pattern có giải thích.
- REST, paging/filter/sort, ProblemDetails, Swagger/OpenAPI.
- SQL Server + EF Core.
- Tối thiểu 15 xUnit/Moq test và coverage.
- Tối thiểu 10 PR, commit tương đối đều.
- GitHub Actions build/test, Dockerfile API, Docker Compose API + SQL Server.
- Responsive public/admin và README chạy bằng `docker compose up`.

## 2. Chức năng thêm đã duyệt - điểm nhấn

### Điểm nhấn 1: Pricing calculator + Compare plans

- Người dùng chọn gói, chu kỳ và promotion hợp lệ để xem giá ước tính, tiền giảm và tổng.
- Cho chọn tối đa 3 gói và so sánh CPU/RAM/SSD/băng thông/giá/đặc điểm.
- Tính giá ở backend; frontend chỉ gửi lựa chọn và hiển thị kết quả.
- Áp dụng Strategy Pattern cho cách tính giá/khuyến mãi.

### Điểm nhấn 2: Tư vấn chọn gói rule-based

- Người dùng nhập/chọn ngân sách, mục đích, traffic dự kiến và yêu cầu cấu hình.
- Backend chấm điểm các gói đang hoạt động rồi trả 1-3 gợi ý kèm lý do.
- Không gọi AI bên ngoài, không vector database, không mất phí.
- Kết quả phải giải thích được bằng rule; có unit test cho rule quan trọng.

### Tiện ích hỗ trợ: tra cứu đơn bằng tracking code

- Sau khi gửi order request, trả mã tracking khó đoán đủ dùng cho demo.
- Public chỉ xem trạng thái và thông tin an toàn; không lộ internal note.
- Đây là phần mở rộng nhỏ của module Gói A, làm sau luồng đặt đơn cơ bản.

## 3. Không triển khai trong phiên bản nộp

- QR chuyển khoản có sẵn số tiền, xác nhận thanh toán tự động, VNPay/MoMo/bank webhook.
- Chatbot AI/open-source model, RAG/vector database.
- Bán/provision VPS/domain thật, kết nối nhà cung cấp cloud thật.
- Email/SMS thật, hợp đồng điện tử hoặc hóa đơn điện tử.

Các mục trên chỉ trình bày ở “Hướng phát triển”; không đưa vào demo chính để tránh câu hỏi bảo mật/tích hợp ngoài phạm vi.

## 4. Design Patterns dự kiến để báo cáo

| Pattern | Nơi áp dụng | Người giải thích chính |
|---|---|---|
| Repository | Truy cập dữ liệu qua abstraction ở Application, implementation ở Infrastructure | TV2 + trưởng nhóm |
| Unit of Work | Một lần lưu/transaction cho thay đổi nghiệp vụ liên quan | Trưởng nhóm |
| Strategy | Tính giá/khuyến mãi hoặc chấm điểm recommendation | Trưởng nhóm |
| Factory | Sinh tracking code hoặc QR target/generator | Gói A hoặc TV2 |

Chỉ ghi pattern thực sự có code và giải thích được. Không thêm pattern cho đủ số lượng.

