# Hướng dẫn Bàn Giao và Triển Khai (Deploy) Dự án CloudService

Tài liệu này hướng dẫn 2 cách deploy dự án ở mức độ "Website thật" tùy thuộc vào mục đích của bạn (Chấm điểm/Bàn giao local hoặc Public lên Internet).

---

## Cách 1: Chạy Docker Compose (Dùng cho Bàn giao, Chấm điểm hoặc chạy trên Server VPS)
*Đây là profile production-like tái lập được trên máy local hoặc VPS: Frontend, Backend, Nginx và DB chạy cùng một Compose project. TLS, backup ngoài máy và quản trị secret vẫn phải cấu hình ở hạ tầng thật.*

**Cấu trúc cải tiến:**
Chúng ta đã tạo thêm file `docker-compose.prod.yml` và thư mục `nginx`. Nginx sẽ đóng vai trò điều hướng traffic, giúp bạn truy cập website ở cổng `80` mặc định thay vì phải gõ port `:3000` (Frontend) hay `:8080` (Backend).

**Các bước thực hiện:**
1. Mở file `.env.production`, điền các thông tin bảo mật và API Telegram của bạn. Không commit file này.
2. Copy toàn bộ nội dung của `.env.production` vào `.env` local (hoặc truyền biến môi trường trực tiếp trên server).
3. Mở Terminal (Command Prompt / PowerShell) tại thư mục gốc của dự án.
4. Chạy preflight để bắt lỗi secret/URL trước khi làm container restart:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\validate-production-env.ps1
   ```
   Script chỉ báo tên biến đang sai, không in token/JWT ra màn hình.
5. Chạy lệnh sau để build và khởi động:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```
6. Kiểm tra trạng thái và truy cập `http://localhost` (đã tự động giấu port):
   ```powershell
   docker compose -f docker-compose.prod.yml ps
   curl.exe -sS -o NUL -w "readiness=%{http_code}\n" http://localhost/health/ready
   ```
   Local HTTP phải giữ `SESSION_COOKIE_SECURE=false`; bật `true` trên HTTP sẽ làm trình duyệt từ chối cookie đăng nhập.

> **Lưu ý:** `docker-compose.prod.yml` là profile production-like có Nginx HTTP. Khi public thật, cần TLS ở Nginx/load balancer và đặt `SESSION_COOKIE_SECURE=true`; không dùng HTTP public.

### Quick Tunnel demo công khai (một lệnh, dùng lại sau mỗi lần bật máy)

Đây là cách nhanh nhất để giảng viên/bạn bè truy cập từ xa mà không phải mở port router. Cloudflare cấp một hostname `trycloudflare.com` tạm thời; URL có thể đổi sau khi Docker Desktop hoặc tunnel khởi động lại. Máy tính, Docker Desktop và container phải luôn bật trong thời gian demo.

Mở **PowerShell hoặc Terminal tích hợp của VS Code** (không cần `cd`, chạy được từ bất kỳ thư mục nào) và chạy đúng một lệnh:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\ProJect\HK7_y25-26\pt PM HĐT\BT end\CloudService\scripts\start-demo-deploy.ps1"
```

Script tự động:

1. Kiểm tra Docker Engine và `.env` mà không in secret. Nếu `.env` bất thường lớn hơn 1 MB (dấu hiệu file bị hỏng), script phục hồi cấu trúc hợp lệ từ phần prefix an toàn, giữ lại DB password/JWT/Telegram đang có và không đưa các giá trị đó ra console.
2. Sinh `JWT_SECRET` bằng bộ sinh ngẫu nhiên an toàn nếu giá trị còn là placeholder; nếu đã hợp lệ thì giữ nguyên để không làm mất phiên đăng nhập. Secret được lưu **chỉ trong `.env` (đã ignore bởi Git)**, không chèn vào source code.
3. Ghép `docker-compose.prod.yml` với overlay demo `docker-compose.demo.yml`, rồi build API và frontend **tuần tự** trước khi chạy DB, API, frontend và Nginx; cách này tránh đỉnh RAM .NET + Next.js trên laptop 8 GB. Không xóa volume dữ liệu.
4. Tạo hoặc tái sử dụng container `cloudservice-quick-tunnel`, phát hiện URL HTTPS và cập nhật `PUBLIC_BASE_URL` cho CORS, Telegram QR/deep-link. Nginx giữ `X-Forwarded-Proto=https` từ Cloudflare cho các BFF route, nên CSRF same-origin vẫn nghiêm ngặt mà Admin/Editor/Affiliate và form đặt đơn không bị chặn sai. Frontend Compose dùng `NEXT_PUBLIC_API_BASE_URL=/api` cùng origin qua Nginx, nên hostname Quick Tunnel đổi cũng không phải build frontend lần hai. Overlay demo đồng thời bảo đảm `admin`, `editor`, và một Affiliate Bạc `affb / affb123` có biểu đồ/ledger/payout, bài viết và Q&A mẫu có mặt trên database demo.
5. Chờ readiness local và public, kiểm tra HTTP `200`, sau đó in URL để bạn gửi cho người khác.

Kết quả thành công có dạng:

```text
Demo deploy is ready.
Public URL: https://<random>.trycloudflare.com
Local URL:  http://localhost
```

Sau khi tắt máy, chỉ cần mở Docker Desktop, đợi biểu tượng Docker báo **Engine running**, rồi chạy lại đúng lệnh trên. **Không chạy riêng `docker compose up` mặc định** cho luồng này: script đã tự chạy đúng Compose production (`docker-compose.prod.yml`) và overlay demo theo thứ tự an toàn. Không dùng `docker compose down -v` vì lệnh đó xóa database volume. `docker compose down` không có `-v` vẫn giữ volume. Các bài viết/Q&A demo dùng slug/tracking code cố định nên lần seed sau chỉ bổ sung bản ghi còn thiếu, không ghi đè nội dung mà Admin/Editor đã sửa. Quick Tunnel miễn phí phù hợp demo/chấm bài, không phải SLA production; nếu cần URL cố định 24/7 hãy dùng VPS/domain và tunnel có named account.

### Checklist mở lại demo sau khi tắt máy

1. Mở **Docker Desktop**; chỉ tiếp tục khi trạng thái là **Engine running**.
2. Mở **PowerShell** hoặc Terminal của VS Code. Không chạy `npm run dev`, `dotnet run`, hay `docker compose up` thường song song vì chúng là profile local khác với website demo.
3. Dán nguyên lệnh sau và chờ tới khi xuất hiện `Demo deploy is ready.`:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File "D:\ProJect\HK7_y25-26\pt PM HĐT\BT end\CloudService\scripts\start-demo-deploy.ps1"
   ```

4. Copy dòng `Public URL: https://...trycloudflare.com` cuối màn hình để gửi giảng viên/bạn bè. Dùng `http://localhost` nếu chỉ trình bày trên máy này.
5. Đăng nhập Affiliate tại `/affiliate/login` bằng `affb / affb123`. Tài khoản này luôn là hạng **Bạc**, có vòng avatar bạc, biểu đồ 8 tuần, đơn/hoa hồng và payout; `aff2` đã được retire nên không còn là tài khoản demo hợp lệ.

Lệnh ở bước 3 **đã bao gồm Docker Compose**: nó build khi cần, chạy tương đương `docker compose --env-file .env -f docker-compose.prod.yml up -d --force-recreate api frontend nginx`, seed dữ liệu bằng overlay demo, rồi tạo/kiểm tra tunnel. Vì vậy chạy thêm `docker compose up` trước đó chỉ tạo thêm một profile local không cần thiết, tốn RAM và làm bạn khó biết đang xem database nào.

Sau khi script báo thành công, `.env` sẽ có dạng sau (hostname thay đổi theo lần chạy):

```dotenv
PUBLIC_BASE_URL=https://<quick-tunnel>.trycloudflare.com
NEXT_PUBLIC_API_BASE_URL=/api
SESSION_COOKIE_SECURE=true
```

`NEXT_PUBLIC_API_BASE_URL=/api` là **cấu hình chủ đích**, không phải thiếu URL. Khi bạn mở website bằng `https://<quick-tunnel>.trycloudflare.com`, browser tự gọi đúng `https://<quick-tunnel>.trycloudflare.com/api` qua Nginx cùng origin. Nếu lưu full URL vào biến này, mỗi hostname Quick Tunnel mới lại buộc phải build frontend lại và dễ gây lỗi CORS; không sửa nó thành hostname cũ.

### JWT_SECRET: lệnh tạo và cách Compose ánh xạ

Không đặt JWT secret trực tiếp trong C# hoặc JavaScript. Khi cần chủ động tạo lại (việc này sẽ làm các JWT/refresh token cũ hết hiệu lực), chạy từ PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\ProJect\HK7_y25-26\pt PM HĐT\BT end\CloudService\scripts\prepare-local-demo.ps1" -PublicBaseUrl "http://localhost" -ApiBaseUrl "/api" -RegenerateJwt
```

Thông thường **không cần** chạy lệnh này riêng; `start-demo-deploy.ps1` đã tự làm khi phát hiện placeholder. Trong `docker-compose.prod.yml`, biến an toàn trong `.env` là `JWT_SECRET` và Compose ánh xạ nội bộ thành `Jwt__Secret` cho ASP.NET Core. Vì vậy không cần (và không nên) sửa code để nhúng giá trị bí mật.

### Tài khoản quản trị trên database mới

Production base (`docker-compose.prod.yml`) cố ý tắt demo seed/reset-password, vì vậy database VPS hoàn toàn mới sẽ chưa có tài khoản đăng nhập. Đây là chốt bảo mật, không phải lỗi UI. Có ba cách hợp lệ:

* **Bàn giao/chấm điểm local:** dùng `docker-compose.yml` (Development) để seed `admin`/`editor` theo các biến `SEED_*` trong `.env`.
* **Quick Tunnel demo:** dùng đúng `scripts/start-demo-deploy.ps1`. Script ghép thêm `docker-compose.demo.yml`, tạo/đồng bộ `admin`, `editor` và `affb / affb123` (Affiliate Bạc với biểu đồ/ledger/payout), bốn bài blog có ảnh Markdown và hai luồng Q&A (Admin/Editor) một cách idempotent; overlay chỉ dành cho demo local, không dùng trên VPS thật.
* **VPS thật:** trước khi mở traffic, đặt password bootstrap mạnh trong `.env` rồi chạy một lần command dưới đây. Command chạy API ở Development chỉ để tạo user bằng đúng password hasher của ứng dụng; sau đó production vẫn chạy với seed tắt và không reset password:

  ```powershell
  docker compose -f docker-compose.prod.yml run --rm `
    -e ASPNETCORE_ENVIRONMENT=Development `
    -e Telegram__Enabled=false `
    -e Seed__DemoUsers__Enabled=true `
    -e Seed__DemoUsers__ResetPasswordOnStartup=true `
    -e Seed__DemoUsers__Admin__UserName=admin `
    -e Seed__DemoUsers__Admin__FullName="CloudService Administrator" `
    -e Seed__DemoUsers__Admin__Email=admin@your-domain.example `
    -e Seed__DemoUsers__Admin__Password="<strong-one-time-password>" `
    api
  ```

  Xóa password khỏi shell history sau khi chạy, đổi password ngay lần đăng nhập đầu tiên, rồi `docker compose ... up -d` lại. Không dùng `ad123` trên VPS.

### VPS checklist (Ubuntu x86-64)

1. Trên trang nhà cung cấp, tạo VM Ubuntu 22.04/24.04 **x86-64**, tối thiểu 2 vCPU, 4 GB RAM và 30 GB SSD. Chọn public IPv4; không chọn ARM cho image SQL Server này.
2. Trong firewall/security-group, chỉ mở `22` (giới hạn IP quản trị nếu có), `80` và `443`. Không mở `1433`, `3000` hay `8080` ra Internet.
3. SSH vào VM, cài Docker Engine + Compose plugin theo tài liệu của nhà cung cấp, sau đó xác nhận `docker info` chạy được.
4. Clone repository vào `/opt/cloudservice`, tạo `.env` bằng `nano /opt/cloudservice/.env` và nhập secrets mới. Không upload `.env` lên GitHub.
5. Trỏ DNS bản ghi `A` của domain về IPv4 VPS. Trước khi có TLS, dùng `PUBLIC_BASE_URL=http://domain-cua-ban`; sau khi reverse proxy có chứng chỉ, đổi sang `https://domain-cua-ban` và `SESSION_COOKIE_SECURE=true`.
6. Chạy `docker compose -f docker-compose.prod.yml config --quiet`, rồi `docker compose -f docker-compose.prod.yml up -d --build`. Kiểm tra `docker compose ... ps`, `curl http://localhost/health/ready` và mở domain trên trình duyệt.
7. Bootstrap admin một lần như mục trên; sau đó tạo backup SQL Server định kỳ và kiểm tra restore. Không xóa volume `cloudservice-prod-sqlserver` khi chưa có backup.

VPS không phải thao tác mà Codex có thể tự đăng nhập thay bạn: cần IP/SSH key/domain và tài khoản nhà cung cấp. Tôi có thể tự động hóa build, smoke test và sửa repository local; bạn chỉ phải thực hiện các bước cấp quyền/secret bên ngoài máy này.

### Chuẩn bị Telegram trước khi bật thông báo

Code hiện tại tích hợp **Telegram Bot API chuẩn**, không gửi được chỉ bằng Telegram user ID. Cần hai giá trị:

1. `Bot token` do `@BotFather` cấp.
2. `chat_id` của cuộc trò chuyện nhận thông báo (thường là số âm với group/channel; bot phải được thêm vào group hoặc làm admin channel).

Không gửi token vào Git, issue, chat nhóm hay prompt. Với local Development, chạy script để lưu ngoài repository:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\configure-local-secrets.ps1 -PublicBaseUrl http://localhost:3000
```

Khi chạy API trực tiếp bằng `dotnet run`, script sẽ hỏi token và chat ID bằng input masked, bật Telegram và tạo JWT secret development nếu còn thiếu. Khi chạy Compose, đặt các biến `TELEGRAM_ENABLED`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `PUBLIC_BASE_URL` trong `.env`; Compose tự ánh xạ chúng sang cấu hình ASP.NET nested.

Script `configure-local-secrets.ps1` chỉ dành cho trường hợp chạy API trực tiếp bằng `dotnet run`; nó hỏi token/chat ID tương tác và lưu vào user-secrets. Với Docker Compose, `start-demo-deploy.ps1` dùng các giá trị Telegram đã có trong `.env`, không hỏi lại và không in token. Để kiểm tra, tạo một order hợp lệ từ UI public rồi xem bot nhận card/QR. Sự kiện được ghi vào `OutboxMessages` trước; worker gửi bất đồng bộ và retry/backoff khi Telegram tạm thời lỗi. Nếu `PublicBaseUrl` là localhost, thông báo vẫn gửi được nhưng link QR trong điện thoại sẽ không mở; Quick Tunnel cung cấp HTTPS URL để kiểm tra trên thiết bị khác.

---

## Cách 2: Triển khai Miễn Phí lên Cloud (Không tốn tiền mua Server)
*Không nên hứa “VPS miễn phí 24/7” cho stack này: SQL Server container cần host x86-64 và tài nguyên ổn định; nhiều free tier là ARM hoặc sleep/ephemeral. Nếu bạn chấp nhận các giới hạn đó và muốn website online không trả phí, có thể tách dịch vụ như sau:*

### Bước 1: Database (Azure SQL - Miễn phí)
1. Đăng ký tài khoản Microsoft Azure.
2. Tạo một **Azure SQL Database** nếu tài khoản đủ điều kiện nhận Free Offer (100k vCore seconds/tháng). Azure for Students Starter có thể không tương thích; kiểm tra trực tiếp trong Azure Portal trước khi phụ thuộc vào gói này.
3. Sau khi tạo, bạn sẽ có một "Connection String" của Database.

### Bước 2: Backend API (Render - Miễn phí)
1. Đăng ký tài khoản [Render.com](https://render.com) (Liên kết với GitHub).
2. Push source code này lên GitHub cá nhân của bạn.
3. Trong Render, tạo **New Web Service** -> Chọn kết nối với Repo GitHub của bạn.
4. Render sẽ tự động nhận diện file `render.yaml` mà chúng ta vừa tạo sẵn và cấu hình giúp bạn.
5. Trong mục Environment Variables của Render, bạn cấu hình:
   - `ConnectionStrings__DefaultConnection` = Connection String từ Azure ở Bước 1.
   - `Jwt__Secret` = Chuỗi bảo mật ngẫu nhiên.
   - `Telegram__BotToken` & `Telegram__ChatId` = Thông tin Telegram của bạn.
   - `Telegram__Enabled` = `true`.
   - `Telegram__PublicBaseUrl` = Link Vercel ở Bước 3.
   - `PublicBaseUrl` và `Cors__AllowedOrigins__0` = Link Vercel ở Bước 3.
6. Khi deploy xong, Render cấp cho bạn một domain ví dụ: `https://ten-du-an-api.onrender.com`.

### Bước 3: Frontend (Vercel - Miễn phí)
1. Đăng ký tài khoản [Vercel.com](https://vercel.com) bằng GitHub.
2. Tạo Project mới, chọn repo GitHub chứa dự án này.
3. Trong Project Settings, đặt **Root Directory = `frontend`** vì repository là monorepo.
4. Trong mục **Environment Variables** trên Vercel, thêm biến:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://ten-du-an-api.onrender.com/api` (Link lấy từ Bước 2).
   - `NEXT_PUBLIC_DEMO_MODE` = `false`
5. Thêm `BACKEND_API_BASE_URL` = cùng URL API Render (server-side BFF), sau đó nhấn **Deploy**.

> **Giới hạn phải chấp nhận:** Render Free có filesystem ephemeral, spin-down khi idle và không phù hợp production. File upload vào `wwwroot` có thể mất sau restart/redeploy; muốn giữ media phải dùng S3/MinIO/Azure Blob hoặc hạ tầng có persistent disk. Vì vậy phương án free không thể cam kết đầy đủ như local nếu chưa xử lý object storage.

---

**Kết luận:** Compose local sau khi điền `.env` là profile bàn giao có thể tái lập. Vercel + Render + Azure SQL không thể cam kết “tương thích 100%/không lỗi” trước khi chạy smoke test trên chính tài khoản, domain, TLS, database và secrets của bạn; đặc biệt phải xử lý filesystem upload và biến môi trường nested như trên.
