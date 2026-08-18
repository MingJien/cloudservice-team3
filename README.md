# MekongNode Cloud Service - Team Starter v2

Starter v2 là nền móng dùng chung cho nhóm 4 thành viên. Mọi phạm vi nghiệp vụ đã được giữ ranh giới theo `docs/01-phan-cong-va-quy-dinh.md`; không bắt đầu từ bản ZIP này bằng `git init`, commit hoặc push. Khi có repository chính thức, trưởng nhóm đưa nguyên starter lên `develop`, sau đó từng thành viên clone mới và làm phần mình trên feature branch.

## Đọc trước khi code

1. `docs/00-prompt-codex-hoan-thien-khung-ban-dau.md`
2. `docs/01-phan-cong-va-quy-dinh.md`
3. `docs/02-database-contract.md`
4. `docs/03-api-contract-v1.md`
5. `docs/06-pham-vi-chuc-nang-chot.md`
6. `docs/07-design-system-va-layout.md`
7. `database/CloudServiceDb_v1.sql`

## Những gì starter đã có

- Clean Architecture `.NET 10`: Domain, Application, Infrastructure, WebApi; namespace thống nhất `CloudService.*`.
- SQL Server/EF Core 10 Code First: đầy đủ entity, mapping riêng từng entity, check constraint/index/FK, một migration `InitialCreate` và seed role/category/gói/giá public mẫu.
- API dùng chung: `/health`, ProblemDetails, validation lỗi chuẩn, CORS từ configuration, OpenAPI/Swagger Bearer JWT và Auth API `login`, `refresh`, `change-password`.
- Auth dùng PBKDF2-SHA256, JWT access token, refresh-token hash/rotation/revoke; audit không ghi password, token hay JWT secret.
- Next.js App Router, TypeScript strict, Tailwind, token MekongNode, public/admin layout, component dùng chung và route placeholder theo contract.
- xUnit + Moq: invariant Domain và luồng Auth Application.

Không có CRUD/API/UI nghiệp vụ cho TV2, Gói A hoặc Gói B trong starter này. Pricing, compare và advisor cũng chỉ có placeholder để trưởng nhóm làm ở PR riêng.

## Cấu trúc

```text
backend/
  src/CloudService.Domain/          # entity, enum, invariant; không phụ thuộc EF/ASP.NET
  src/CloudService.Application/     # Auth contract/service, paging, exception dùng chung
  src/CloudService.Infrastructure/  # EF mapping, DbContext, migration, JWT/PBKDF2, seed
  src/CloudService.WebApi/           # controller, middleware, Swagger, /health
  tests/CloudService.Domain.Tests/
  tests/CloudService.Application.Tests/
frontend/
  src/app/                           # App Router public/admin và route placeholder
  src/components/ui/                 # Button, Input, Select, Card, Badge, Modal, Table...
  src/components/layout/             # public layout và admin shell
  src/components/landing/            # một file cho mỗi landing section
  src/features/                      # vùng sở hữu từng thành viên
  src/lib/api-client.ts
database/
  CloudServiceDb_v1.sql              # schema tham chiếu an toàn, không phải migration source of truth
docs/
```

## Yêu cầu môi trường

- .NET SDK 10.0.x và `dotnet-ef` 10.0.x.
- Node.js 20.9+ và npm.
- SQL Server 2022+ hoặc SQL Server Developer/Express có SQL authentication khi chạy local.
- SSMS hoặc `sqlcmd` là tùy chọn để kiểm tra script tham chiếu.

Không commit `.env`, `.env.local`, JWT secret, mật khẩu database hay mật khẩu demo. Dùng [`.env.example`](.env.example) và [`frontend/.env.example`](frontend/.env.example) làm danh sách biến cần có.

## Chạy backend và database

Tại root starter, đặt các biến môi trường local. Ví dụ PowerShell (thay toàn bộ `CHANGE_ME` bằng giá trị local, không lưu file chứa secret):

```powershell
$env:ConnectionStrings__DefaultConnection = "Server=localhost,1433;Database=CloudServiceDb;User Id=sa;Password=CHANGE_ME;TrustServerCertificate=True;Encrypt=True"
$env:Jwt__Secret = "CHANGE_ME_USE_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS"
```

Trên máy đã khởi tạo starter này, instance SQL Server là `MSI\MCHIENCS` và dùng Windows/Integrated Security. Dùng biến kết nối sau thay cho ví dụ SQL authentication ở trên:

```powershell
$env:ConnectionStrings__DefaultConnection = "Server=MSI\MCHIENCS;Database=CloudServiceDb;Integrated Security=True;TrustServerCertificate=True;MultipleActiveResultSets=True"
```

Tạo database từ migration (nguồn sự thật sau khi starter vào repository):

```powershell
dotnet ef database update --project backend/src/CloudService.Infrastructure/CloudService.Infrastructure.csproj --startup-project backend/src/CloudService.Infrastructure/CloudService.Infrastructure.csproj
```

Để tạo demo Admin/Editor, chỉ bật seed sau khi đã cung cấp password local. Password được PBKDF2 hash tại thời điểm seed và không tồn tại trong source hoặc SQL.

```powershell
$env:Seed__DemoUsers__Enabled = "true"
$env:Seed__DemoUsers__Admin__UserName = "admin"
$env:Seed__DemoUsers__Admin__FullName = "Quản trị viên Demo"
$env:Seed__DemoUsers__Admin__Email = "admin@example.local"
$env:Seed__DemoUsers__Admin__Password = "SET_A_LOCAL_PASSWORD"
$env:Seed__DemoUsers__Editor__UserName = "editor"
$env:Seed__DemoUsers__Editor__FullName = "Biên tập viên Demo"
$env:Seed__DemoUsers__Editor__Email = "editor@example.local"
$env:Seed__DemoUsers__Editor__Password = "SET_A_LOCAL_PASSWORD"

dotnet run --project backend/src/CloudService.WebApi/CloudService.WebApi.csproj --urls http://localhost:8080
```

Mở `http://localhost:8080/swagger` để thử API; health ở `http://localhost:8080/health`. Nếu muốn ứng dụng tự apply migration khi khởi động local, đặt thêm `Database__ApplyMigrationsOnStartup=true`; không bật tùy chọn này cho môi trường dùng chung/production.

`database/CloudServiceDb_v1.sql` chỉ phục vụ đối chiếu hoặc tạo schema tham chiếu trên database mới. Script không drop database/bảng; khi đã có repository, không dùng script để thay migration.

## Chạy frontend

```powershell
cd frontend
Copy-Item .env.example .env.local
npm ci
npm run dev
```

`NEXT_PUBLIC_API_BASE_URL` mặc định là `http://localhost:8080/api`. API client chung chuẩn hóa `ProblemDetails` thành `ApiError`; chủ module không hard-code URL và không thêm client riêng khi chưa cần.

## Kiểm tra trước khi tạo PR

```powershell
dotnet restore backend/CloudService.sln
dotnet build backend/CloudService.sln --no-restore
dotnet test backend/CloudService.sln --no-build

cd frontend
npm ci
npm run lint
npx tsc --noEmit
npm run build
```

## Chủ module và TODO tiếp theo

| Chủ | TODO sau starter |
|---|---|
| Trưởng nhóm | UI login dùng Auth API, audit-log read API/UI, pricing/compare/advisor, CI/Docker/deploy. |
| TV2 | CRUD category/plan/price/promotion, public plan data, QR URL/generator, audit thay đổi giá. |
| Gói A | Order request/tracking, affiliate, status transition, dashboard, Excel export. |
| Gói B | Landing content thật, service/blog/contact/testimonial API/UI, search/paging và admin content. |

Không chủ module nào tự tạo migration mới hoặc thay đổi DB/API/design token khi chưa được duyệt. Xem `docs/04-quy-trinh-truoc-va-sau-khi-co-git.md` để mang đúng phần code vào repository chính thức.
