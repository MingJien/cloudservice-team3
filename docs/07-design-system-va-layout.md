# DESIGN SYSTEM VÀ QUY ƯỚC GIAO DIỆN

## 1. Định hướng thương hiệu

- Tên làm việc: **MekongNode**. Chốt tên khác được, nhưng phải đổi một lần trước khi code UI chính.
- Tính cách: hạ tầng tin cậy, kỹ thuật rõ ràng, gần gũi doanh nghiệp Việt Nam.
- Cảm hứng địa phương dùng rất nhẹ: sắc nước sâu + một điểm nhấn san hô/hoa sen; không dùng hình sen lớn hoặc họa tiết du lịch.
- Giao diện ưu tiên thông tin, bảng giá và độ tin cậy; không dựng kiểu landing AI với nhiều khối phát sáng vô nghĩa.

## 2. Bảng màu bắt buộc

| Token | Mã màu | Cách dùng |
|---|---|---|
| `ink-950` | `#0B132B` | Heading, sidebar, footer, nền hero tối |
| `river-700` | `#174A7E` | Link, icon chính, trạng thái active |
| `river-600` | `#1E66A5` | Primary button và interactive |
| `lotus-500` | `#E06C75` | CTA/điểm nhấn rất ít, không dùng làm màu nền diện rộng |
| `ice-100` | `#EAF3F7` | Section nhẹ, chip, nền selected |
| `paper-50` | `#FAFAF7` | Nền public chính, tạo cảm giác bớt “template trắng tinh” |
| `slate-600` | `#5E6B7A` | Body text phụ |
| `line-200` | `#D7E0E8` | Border/divider |
| `success-600` | `#16805D` | Thành công/Done |
| `warning-600` | `#B26A13` | Processing/cảnh báo |
| `danger-600` | `#B83A4B` | Lỗi/Rejected/destructive |

Quy tắc: một màn hình dùng `river` làm màu tương tác chính và tối đa 1 điểm `lotus`. Không tự thêm purple/neon/gradient mới.

## 3. Typography và icon

- Font chính: **Be Vietnam Pro**, fallback `Arial, sans-serif`; hỗ trợ tiếng Việt tốt.
- Heading: 600-700; body: 400-500; không dùng quá 3 cỡ chữ trong cùng một card.
- Body desktop 16px/1.6; admin table 14px/1.5; nội dung blog tối đa 70-75 ký tự mỗi dòng.
- Icon dùng một bộ duy nhất như Lucide; stroke 1.75-2px. Không dùng emoji làm icon UI.

## 4. Grid, khoảng cách và component

- Public container: tối đa 1200px, padding ngang 24px desktop/16px mobile.
- Grid desktop 12 cột; tablet 8; mobile 4.
- Section spacing: 88-104px desktop, 56-64px mobile.
- Card radius 16px; input/button 10-12px. Shadow nhẹ, ưu tiên border rõ.
- Button cao 44-48px; touch target tối thiểu 44px.
- Table luôn có header, loading skeleton, empty state, error state và pagination.
- Badge trạng thái dùng đúng semantic color, không chỉ phân biệt bằng màu mà phải có chữ.

## 5. Bố cục landing thống nhất

1. Header gọn: logo chữ, Dịch vụ, Bảng giá, Blog, Giới thiệu, Liên hệ; CTA “Tư vấn gói”.
2. Hero 2 cột: bên trái value proposition + 2 CTA; bên phải là panel hạ tầng/metric có cấu trúc, không dùng ảnh 3D cloud đại trà.
3. Trust strip: uptime, hỗ trợ, datacenter; không bịa số khách hàng/chứng chỉ.
4. Service categories.
5. Featured plans + chuyển tháng/năm.
6. Compare plans/pricing calculator.
7. Rule-based advisor.
8. Datacenter/SLA.
9. Testimonial/logo có dữ liệu demo ghi rõ.
10. News mới + CTA + footer.

Mỗi section là một component riêng. Người chọn Gói B làm hero/service/content/testimonial/news; trưởng nhóm làm pricing/compare/advisor và ghép thứ tự cuối.

## 6. Bố cục admin thống nhất

- Sidebar 256px nền `ink-950`, menu nhóm theo Catalog/Content/Requests/System.
- Topbar 64px: breadcrumb, user/role, logout.
- Nội dung nền `paper-50`; mỗi page có title, mô tả ngắn, primary action bên phải.
- Filter bar nằm trên table; form create/edit dùng cùng component, label ở trên input.
- Không biến dashboard thành nhiều card màu. KPI card nền sáng, chỉ dùng màu ở icon/badge.

## 7. Responsive và accessibility

- Kiểm tra tối thiểu 375px, 768px, 1280px.
- Mobile: sidebar thành drawer; table quan trọng có scroll hoặc chuyển card hợp lý.
- Có focus-visible, label thật, alt text, keyboard navigation và contrast dễ đọc.
- Không đặt chữ trực tiếp trên ảnh khó đọc; không dùng animation liên tục.

## 8. Những kiểu “AI template” không được dùng

- Gradient tím-xanh phủ toàn trang, glowing orb, glassmorphism hàng loạt.
- Mỗi card một màu/gradient khác nhau.
- Ảnh 3D cloud/server giống stock, robot AI hoặc nhân vật hoạt hình không liên quan.
- Slogan rỗng như “Revolutionize your digital future” mà không nói dịch vụ cụ thể.
- Số liệu, logo khách hàng, ISO/datacenter giả được trình bày như dữ liệu thật.
- Dùng quá nhiều icon, badge “AI powered”, animation hoặc section lặp lại.

## 9. Quy trình duyệt giao diện

1. Trước khi code page, chủ module gửi wireframe hoặc ảnh bố cục đơn sắc.
2. Trưởng nhóm duyệt layout và component dùng chung.
3. Chủ module code responsive theo token; không tự đổi palette.
4. PR giao diện phải kèm danh sách route và kích thước đã kiểm tra; không bắt buộc gửi video.
5. Nếu cần component mới, thêm vào feature trước; chỉ đưa vào shared khi ít nhất hai module dùng.

