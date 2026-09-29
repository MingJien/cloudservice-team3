# PHẠM VI CHỨC NĂNG 


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


