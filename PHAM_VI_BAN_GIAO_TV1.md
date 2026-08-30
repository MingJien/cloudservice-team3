# Phạm vi nhánh TV1 — core, landing và tích hợp

Thư mục này là phần còn lại của `CloudService` sau khi đã tách các module TV2, TV3 và TV4 theo phân công.

Bao gồm: kiến trúc và cấu hình chung, authentication/authorization, shared layout và design system, landing UI, branding, các thành phần deployment/CI và những phần code không thuộc catalog–pricing, order–affiliate hoặc content–blog.

Không bao gồm `.env`, thư mục sinh tự động hay source đã tách cho TV2–TV4. Theo số dòng source hiện tại (`.cs`, `.ts`, `.tsx`, `.css`, `.sql`), gói này có 37,278/51,425 dòng, tương đương 72.5%.

Gói được trích từ dự án tích hợp để tổ chức công việc. Commit trên Git cần phản ánh công việc người commit thực sự đã review, kiểm thử hoặc hoàn thiện.
