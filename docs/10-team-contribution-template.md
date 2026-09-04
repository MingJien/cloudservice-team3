# Mẫu evidence đóng góp của bốn thành viên

Tài liệu này chỉ là mẫu. Nhóm phải điền bằng commit, pull request, issue và ảnh/video demo thật; không tạo lịch sử Git hoặc số liệu review giả.

| Thành viên | Module ownership | PR/commit thật | Test/evidence | Reviewer |
|---|---|---|---|---|
| TV1 — Tech Lead | Architecture, Auth, Audit, Pricing, Compare, Advisor | `<link hoặc SHA>` | `<lệnh/test>` | `<tên>` |
| TV2 | Catalog, plan/price/promotion, QR | `<link hoặc SHA>` | `<lệnh/test>` | `<tên>` |
| TV3 | Orders, tracking, affiliate, dashboard, export | `<link hoặc SHA>` | `<lệnh/test>` | `<tên>` |
| TV4 | Public content, blog, testimonial, contact, landing UI | `<link hoặc SHA>` | `<lệnh/test>` | `<tên>` |

## Quy tắc review

1. Mỗi PR có mục tiêu, file chính, cách test và ảnh màn hình nếu thay đổi UI.
2. Tác giả không tự approve PR của mình.
3. Không merge khi CI đỏ hoặc còn TODO nghiệp vụ trong module đã nhận.
4. Commit mô tả hành vi thay đổi, không dùng một commit khổng lồ cho toàn bộ bài.
5. Nếu dùng AI hỗ trợ, thành viên phải đọc, chạy, giải thích và chịu trách nhiệm về code.
