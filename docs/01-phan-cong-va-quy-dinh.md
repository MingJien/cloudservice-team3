# PHÂN CÔNG VÀ QUY ĐỊNH LÀM VIỆC

## 1. Phân công cố định và hai gói để TV3/TV4 lựa chọn

TV3 và TV4 chọn một trong hai gói A/B. Mỗi gói chỉ có một người nhận. Người nhận phải làm full-stack trong phạm vi module: backend API, frontend gọi API thật, dữ liệu test và unit test logic chính.

| Người/gói | Ưu tiên và phạm vi bắt buộc | Sản phẩm kỹ thuật phải có | Việc tài liệu |
|---|---|---|---|
| **Trưởng nhóm - Tech Lead** | Dựng Clean Architecture; DB contract/migration đầu; JWT + refresh token + Admin/Editor + đổi mật khẩu; layout/design system chung; pricing calculator, so sánh gói, tư vấn chọn gói rule-based; tích hợp cuối, CI, Docker, deploy, README | Auth API; pricing/recommendation API và UI; shared layout/components; tối thiểu 4 test; PR kỹ thuật riêng; Docker/CI/deploy | Duyệt code, báo cáo, slide; phụ trách phần mở đầu/kiến trúc/điểm nhấn và demo tổng |
| **TV2 - anh T - Admin dịch vụ** | CRUD danh mục, gói, thông số, giá theo chu kỳ, khuyến mãi; QR dẫn đến chi tiết/đặt gói; public pricing lấy dữ liệu thật; audit khi sửa giá/khuyến mãi | API + admin UI + public data integration; validation, paging/filter/sort; tối thiểu 4 test; các PR riêng | Chủ biên báo cáo; tự viết phần module và pattern mình làm |
| **Gói A - Đơn hàng/Affiliate** | Form đặt dịch vụ; tính/lưu số tiền ước tính; sinh mã tra cứu; trang tra cứu; form affiliate; admin xem/lọc/đổi trạng thái; thống kê theo tháng/gói; xuất Excel | API + public form/tracking + admin pages + chart/export; tối thiểu 4 test | Hỗ trợ báo cáo, chuẩn bị ảnh/luồng nghiệp vụ; thuyết trình luồng đặt hàng và quản lý |
| **Gói B - Public/Content** | Landing sections, giới thiệu/datacenter/SLA; danh sách/chi tiết dịch vụ; blog list/detail/search/category/pagination; admin CRUD blog; testimonial/logo; contact; phối hợp landing với trưởng nhóm | API News/Testimonial/Contact + public UI + admin blog; loading/error/empty/responsive; tối thiểu 3 test | Chủ biên PPT; chuẩn bị ảnh giao diện; thuyết trình public/blog |

### Cách chọn

- TV3 và TV4 phản hồi theo cú pháp: `Tên - chọn Gói A/B - xác nhận đã đọc phạm vi`.
- Nếu cả hai cùng chọn một gói, ưu tiên người phản hồi trước; người còn lại nhận gói kia.
- Người nhận Gói B làm landing cùng trưởng nhóm. Trưởng nhóm giữ phần gói/giá/so sánh/tư vấn; Gói B giữ hero, nội dung, blog, testimonial và contact.

## 2. Ranh giới file để giảm xung đột

| Phạm vi | Người được sửa chính | Quy định |
|---|---|---|
| Solution, `.csproj`, dependency chung, `Program.cs` | Trưởng nhóm | Người khác muốn thêm package/middleware phải báo trước. |
| `DbContext`, migrations, connection/config DB | Trưởng nhóm; TV2 dự phòng | Thành viên sửa entity/config module mình nhưng không tự sinh migration. |
| Auth/JWT/role/shared middleware | Trưởng nhóm | Không copy một hệ auth khác vào project. |
| `Application/Features/Services`, controller dịch vụ | TV2 | Người khác chỉ gọi contract/API đã thống nhất. |
| `Application/Features/Orders`, `Affiliates`, `Dashboard` | Người chọn A | Không đổi trạng thái/DTO mà không báo bên dùng. |
| `Application/Features/Content`, controller news/contact/testimonial | Người chọn B | Không đổi slug/API public mà không báo. |
| Shared frontend layout/component/token | Trưởng nhóm | Muốn sửa component dùng chung phải tách PR nhỏ. |
| Admin service screens | TV2 | Dùng shared components. |
| Order/affiliate screens | Người chọn A | Dùng shared components. |
| Landing/blog/contact screens | Người chọn B + trưởng nhóm theo ranh giới trên | Tách từng section thành component, tránh cùng sửa một file lớn. |

## 3. Definition of Done - chỉ được báo “xong” khi đủ

1. Chức năng đúng phạm vi, chạy được từ đầu đến cuối.
2. API hiện trên Swagger/OpenAPI; request hợp lệ chạy đúng, request sai có validation và status code phù hợp.
3. Danh sách có phân trang; chỗ cần thiết có tìm kiếm/lọc/sắp xếp.
4. Frontend gọi API thật qua biến môi trường, không hard-code URL hoặc dữ liệu giả ở luồng chính.
5. Có loading, empty state và thông báo lỗi; form chặn dữ liệu sai cơ bản.
6. Tự test Swagger trước, sau đó test giao diện; có seed/hướng dẫn tạo dữ liệu test.
7. Có unit test Domain/Application theo chỉ tiêu cá nhân.
8. Không còn lỗi build, lỗi TypeScript, lỗi console nghiêm trọng hoặc secret trong source.
9. Commit có ý nghĩa; PR ghi chức năng, cách test, API/page bị ảnh hưởng và điểm cần người review chú ý.
10. Người làm phải giải thích được luồng, entity/DTO/service/controller/page và trả lời vấn đáp phần mình.

## 4. Quy định chung tránh hiểu lầm

- Không ai chỉ làm giao diện tĩnh. Mỗi gói chức năng phải có API và frontend gọi API thật, trừ nội dung tĩnh như giới thiệu/SLA.
- Không tự đổi tên bảng/cột, enum trạng thái, route API, DTO dùng chung hoặc cài package tùy ý.
- Không sửa trực tiếp code của người khác để “cho nhanh”. Ghi lỗi và yêu cầu chủ module sửa trước; trưởng nhóm chỉ sửa lỗi tích hợp/khẩn cấp.
- Không gửi nguyên source bằng Zalo, Drive hoặc ZIP để trưởng nhóm gộp thủ công.
- Không push thẳng `main`/`develop`; không force push; không xóa branch người khác.
- Không commit `node_modules`, `bin`, `obj`, `.vs`, `.next`, `.env`, mật khẩu DB/JWT secret.
- Code do AI hỗ trợ phải được người nhận đọc, chạy và giải thích được. Không đẩy một lần hàng nghìn dòng chưa kiểm tra.
- QR trong phạm vi hiện tại dẫn tới trang chi tiết hoặc trang đặt gói; QR thanh toán thật chỉ là hướng phát triển.
- Ngày 7 phải có phần đầu tiên để review; ngày 16 chức năng chính phải có PR vào `develop`.

## 5. Phân bổ test tối thiểu 15 case

| Người | Số test tối thiểu | Gợi ý |
|---|---:|---|
| Trưởng nhóm | 4 | đăng nhập/refresh hợp lệ; tính giá; recommendation rule; phân quyền |
| TV2 | 4 | validation gói; giá theo chu kỳ; khuyến mãi còn hạn; QR target URL |
| Gói A | 4 | sinh tracking code; tạo đơn; chuyển trạng thái hợp lệ; tính thống kê |
| Gói B | 3 | sinh slug; lọc/tìm bài; validation contact/news |

Mục tiêu nên đạt 17-20 test để có dư địa nếu một test bị loại khỏi coverage.

## 6. Phân chia thuyết trình sau khi chốt người

- Người chọn Gói B: public UI/blog - phần dễ vào trước.
- Người chọn Gói A: đặt hàng/tra cứu/admin xử lý - phần nghiệp vụ nối tiếp.
- TV2: quản trị dịch vụ/giá/QR/audit - phần kỹ thuật quan trọng.
- Trưởng nhóm: kiến trúc, bảo mật, pattern, test/CI/Docker/deploy, điểm nhấn và điều phối demo.

Demo ngay sau thuyết trình: Public -> đặt đơn -> tra cứu -> admin đăng nhập/xử lý -> giá cập nhật ngoài public -> test/CI pipeline.

