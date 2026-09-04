# Local development runbook

## Mô hình chạy khi đang phát triển

- Docker Desktop: chạy SQL Server duy nhất.
- Visual Studio màu tím: chạy backend ASP.NET Core/API.
- Visual Studio Code màu xanh: chạy frontend Next.js.

Không cần chạy toàn bộ `docker compose` sau mỗi lần sửa code. Cách này nhanh hơn và vẫn dùng đúng SQL Server trong Docker.

## 1. Khởi động SQL Server mỗi ngày

Mở PowerShell mới, chạy đúng thứ tự:

```powershell
cd "D:\ProJect\HK7_y25-26\pt PM HĐT\BT end\CloudService"
docker compose up -d db
docker compose ps
```

Kết quả đạt yêu cầu khi service `db` hiển thị `Up` và sau vài giây là `healthy`. Lần đầu Docker có thể tải image SQL Server hơn 1 GB; chỉ cần chờ hoàn tất.

Nếu Docker báo engine chưa chạy, mở Docker Desktop, chờ trạng thái Running rồi mở lại PowerShell.

## 1.1. Mở hai IDE đúng project

- Visual Studio màu tím: mở `backend/CloudService.sln`, chọn `CloudService.WebApi`, bấm `F5`.
- VS Code màu xanh: mở riêng thư mục `frontend`.

Có thể mở nhanh bằng PowerShell:

```powershell
Start-Process "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\devenv.exe" "D:\ProJect\HK7_y25-26\pt PM HĐT\BT end\CloudService\backend\CloudService.sln"
code "D:\ProJect\HK7_y25-26\pt PM HĐT\BT end\CloudService\frontend"
```

## 2. Chạy backend bằng Visual Studio màu tím

1. Mở `backend/CloudService.sln` bằng Visual Studio.
2. Chọn project `CloudService.WebApi` làm Startup Project.
3. Chọn profile HTTP của WebApi và bấm `F5`.
4. Kiểm tra API tại `http://localhost:8080/health`, kiểm tra cả SQL Server tại `http://localhost:8080/health/ready`, hoặc mở Swagger tại `http://localhost:8080/swagger`.

Backend local phải dùng SQL Server ở `localhost,14330` (Compose map host `14330` → container `1433`), không dùng hostname `db`. Nếu project chưa có user-secrets, cấu hình secret theo `README.md` và giữ `Database__ApplyMigrationsOnStartup=false` sau khi database đã có schema.

## 3. Chạy frontend bằng Visual Studio Code màu xanh

Mở cửa sổ VS Code riêng tại thư mục `frontend`, mở Terminal và chạy lần đầu:

```powershell
cd "D:\ProJect\HK7_y25-26\pt PM HĐT\BT end\CloudService\frontend"
Copy-Item .env.example .env.local -ErrorAction SilentlyContinue
npm ci
npm.cmd run dev
```

Những lần sau chỉ cần:

```powershell
cd "D:\ProJect\HK7_y25-26\pt PM HĐT\BT end\CloudService\frontend"
npm.cmd run dev
```

Nếu `npm.cmd run dev` báo `'next' is not recognized`, chạy `npm.cmd ci` một lần rồi chạy lại. Nếu `npm.cmd ci` báo `EPERM` với file `lightningcss`, dừng Next.js bằng `Ctrl+C`, đóng các terminal/frontend dev đang chạy, rồi chạy lại `npm.cmd ci`; không xóa volume Docker.

Mở website tại `http://localhost:3000`. Giữ `SESSION_COOKIE_SECURE=false` khi chạy HTTP local.

### Quy tắc không chạy trùng Next.js

Mỗi lần chỉ chạy **một** lệnh `npm.cmd run dev` trong **một** terminal. Nếu terminal báo:

```text
Port 3000 is in use
You can access the existing server at http://localhost:3000
```

thì server đầu tiên đang chạy đúng; không chạy thêm lần nữa và không chuyển sang `3001`. Chỉ mở `http://localhost:3000`.

Nếu cần khởi động lại frontend, dừng terminal Next.js hiện tại bằng `Ctrl+C`, sau đó chạy lại:

```powershell
cd "D:\ProJect\HK7_y25-26\pt PM HĐT\BT end\CloudService\frontend"
npm.cmd run dev
```

Nếu terminal cũ đã đóng nhưng cổng vẫn bị giữ, dừng đúng tiến trình đang giữ cổng `3000` rồi chạy lại:

```powershell
$nextProcessId = (Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction Stop).OwningProcess
Stop-Process -Id $nextProcessId -Force
npm.cmd run dev
```

Không dùng PID `33376` cố định cho những lần sau vì PID sẽ thay đổi.

## 4. Khi có thay đổi code

- Chỉ sửa backend: để SQL Server Docker chạy, dừng backend cũ rồi bấm chạy lại trong Visual Studio.
- Chỉ sửa frontend: lưu file; Next.js tự hot reload.
- Sửa database/migration hoặc muốn kiểm tra bản đóng gói: dừng API/frontend đang chạy trong IDE, sau đó chạy `docker compose up -d --build`.
- Không chạy đồng thời API local ở cổng 8080 với API container; không chạy đồng thời frontend local ở cổng 3000 với frontend container.

## 5. Kiểm tra toàn bộ bằng Docker trước demo/deploy

```powershell
cd "D:\ProJect\HK7_y25-26\pt PM HĐT\BT end\CloudService"
docker compose up -d --build
docker compose ps
```

Kiểm tra:

- Website: `http://localhost:3000`
- API health: `http://localhost:8080/health`
- Swagger: `http://localhost:8080/swagger`

Khi kết thúc demo, dừng container nhưng giữ dữ liệu database:

```powershell
docker compose down
```

Không dùng `docker compose down -v` nếu chưa chủ động muốn xóa volume dữ liệu local.

## 6. Tắt môi trường phát triển

- Dừng API bằng nút Stop trong Visual Studio.
- Dừng frontend bằng `Ctrl+C` trong Terminal VS Code.
- Có thể để SQL Server Docker chạy; nếu muốn tắt:

```powershell
cd "D:\ProJect\HK7_y25-26\pt PM HĐT\BT end\CloudService"
docker compose stop db
```
