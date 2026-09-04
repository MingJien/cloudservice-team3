# Database

- Migration nguồn sự thật: `backend/src/CloudService.Infrastructure/Persistence/Migrations/*_InitialCreate.cs`.
- Chạy migration trên database local mới bằng `dotnet ef database update --project backend/src/CloudService.Infrastructure/CloudService.Infrastructure.csproj --startup-project backend/src/CloudService.Infrastructure/CloudService.Infrastructure.csproj`.
- `CloudServiceDb_v1.sql` là schema tham chiếu và script an toàn để đối chiếu bằng SSMS; script không drop database/bảng đang có.
- Tài khoản Admin/Editor không có trong SQL hoặc migration. Chúng chỉ được tạo khi application seeder nhận password qua biến môi trường và hash bằng PBKDF2.
- Không chỉnh tay migration đã vào `develop`; mọi thay đổi contract phải được duyệt rồi tạo migration mới bởi trưởng nhóm.
