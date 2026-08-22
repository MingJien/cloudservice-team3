# API CONTRACT V1

Base URL: `/api`. Tên resource dùng danh từ số nhiều. List trả theo dạng phân trang thống nhất: `items`, `pageNumber`, `pageSize`, `totalCount`, `totalPages`.

## Trưởng nhóm

| Method | Endpoint | Mục đích |
|---|---|---|
| POST | `/api/auth/login` | Đăng nhập admin/editor |
| POST | `/api/auth/refresh` | Cấp access token mới |
| POST | `/api/auth/change-password` | Đổi mật khẩu |
| POST | `/api/pricing/quotes` | Tính giá ước tính theo gói/chu kỳ/promotion |
| POST | `/api/service-plan-recommendations` | Gợi ý gói rule-based theo nhu cầu/ngân sách/traffic |
| GET | `/api/service-plans/compare?ids=1,2,3` | Dữ liệu so sánh gói |
| GET | `/api/audit-logs` | Admin xem audit log |

## TV2 - dịch vụ/giá

| Method | Endpoint | Mục đích |
|---|---|---|
| GET/POST | `/api/service-categories` | Public list/Admin create |
| GET/PUT/DELETE | `/api/service-categories/{id}` | Detail/Admin update/deactivate |
| GET/POST | `/api/service-plans` | List có paging/filter/sort/Admin create |
| GET/PUT/DELETE | `/api/service-plans/{idOrSlug}` | Detail/Admin update/deactivate |
| GET/POST | `/api/plan-prices` | List/Admin create giá |
| PUT/DELETE | `/api/plan-prices/{id}` | Update/deactivate giá |
| GET/POST | `/api/promotions` | List/Admin create promotion |
| PUT/DELETE | `/api/promotions/{id}` | Update/deactivate promotion |
| POST | `/api/service-plans/{id}/qr-code` | Sinh lại QR dẫn đến detail/order |

## Gói A - đơn hàng/affiliate/dashboard

| Method | Endpoint | Mục đích |
|---|---|---|
| POST | `/api/order-requests` | Public gửi yêu cầu đặt dịch vụ |
| GET | `/api/order-requests/track/{trackingCode}` | Public tra cứu đơn, chỉ trả dữ liệu an toàn |
| GET | `/api/order-requests` | Admin list/filter/paging |
| PATCH | `/api/order-requests/{id}/status` | Admin/Editor đổi trạng thái |
| GET | `/api/order-requests/export` | Admin xuất Excel |
| POST | `/api/affiliate-applications` | Public đăng ký affiliate |
| GET | `/api/affiliate-applications` | Admin/Editor list/filter |
| PATCH | `/api/affiliate-applications/{id}/status` | Admin/Editor đổi trạng thái |
| GET | `/api/dashboard/summary` | Tổng quan |
| GET | `/api/dashboard/order-requests-by-month` | Dữ liệu biểu đồ |
| GET | `/api/dashboard/top-service-plans` | Gói được quan tâm |

## Gói B - content/public

| Method | Endpoint | Mục đích |
|---|---|---|
| GET/POST | `/api/news-categories` | Public list/Admin-Editor create |
| PUT/DELETE | `/api/news-categories/{id}` | Admin-Editor update/deactivate |
| GET/POST | `/api/news-articles` | Public list search/category/paging; Admin-Editor create |
| GET | `/api/news-articles/{slug}` | Public detail |
| PUT/DELETE | `/api/news-articles/{id}` | Admin-Editor update/unpublish |
| GET/POST | `/api/testimonials` | Public list/Admin create |
| PUT/DELETE | `/api/testimonials/{id}` | Admin update/deactivate |
| POST | `/api/contact-requests` | Public gửi liên hệ |
| GET | `/api/contact-requests` | Admin/Editor list/filter |
| PATCH | `/api/contact-requests/{id}/status` | Admin/Editor cập nhật trạng thái |

## Chuẩn lỗi và bảo mật

- `200/201/204`: thành công; `400`: validation; `401`: chưa đăng nhập; `403`: sai role; `404`: không tồn tại; `409`: xung đột nghiệp vụ.
- Lỗi trả `ProblemDetails`, không trả stack trace hoặc secret.
- Swagger phải có nút Authorize Bearer JWT và thể hiện response/status chính.
- Public tracking không trả ghi chú nội bộ, token hoặc dữ liệu quản trị.

