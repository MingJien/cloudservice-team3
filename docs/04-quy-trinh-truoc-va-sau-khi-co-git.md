# QUY TRÌNH TRƯỚC VÀ SAU KHI CÓ GITHUB REPOSITORY

## A. Trước khi có repo

1. Tất cả tải cùng một starter ZIP và đọc tài liệu.
2. Được làm thử trong bản sao cá nhân, nhưng chỉ sửa thư mục module mình.
3. Không trao đổi bằng cách chép đè cả thư mục hoặc gửi lại một ZIP “bản mới”.
4. Ghi riêng package muốn cài và thay đổi DB/API muốn đề xuất.
5. Giữ danh sách file mình đã tạo/sửa để sau này mang đúng phần đó vào feature branch.

## B. Khi giảng viên tạo repo - trưởng nhóm làm trước

```bash
git clone <URL_REPO_CUA_GIANG_VIEN>
cd <TEN_REPO>
git switch -c develop
```

Trưởng nhóm chép starter vào repo, kiểm tra lại rồi:

```bash
git status
git add .
git commit -m "chore: initialize clean architecture project skeleton"
git push -u origin develop
```

Sau đó tạo/quy định `main` và `develop` được bảo vệ, không cho push trực tiếp.

## C. Thành viên phải clone lại từ repo chính thức

Không biến folder đang làm thử thành repo bằng `git init`. Clone mới để nhận lịch sử của nhóm:

```bash
git clone <URL_REPO_CUA_GIANG_VIEN>
cd <TEN_REPO>
git switch develop
git pull origin develop
```

Tạo nhánh theo gói:

```bash
git switch -c feature/tv2-service-catalog
git switch -c feature/tv3-orders-affiliates
git switch -c feature/tv4-public-content
```

Chỉ chạy **một** lệnh tạo nhánh phù hợp với người đó. TV3/TV4 đổi tên nhánh theo gói đã chọn.

## D. Mang code làm thử vào nhánh đúng cách

1. Copy từng file/module do mình làm vào bản repo vừa clone.
2. Không copy đè `.git`, solution, `Program.cs`, `DbContext`, migrations, shared layout, `package.json` nếu không được duyệt.
3. Kiểm tra trước khi commit:

```bash
git status
git diff
dotnet build backend/CloudService.sln
dotnet test backend/CloudService.sln
```

Nếu có frontend:

```bash
cd frontend
npm install
npm run lint
npm run build
```

Commit theo từng phần nhỏ:

```bash
git add <CAC_FILE_THUOC_MODULE_CUA_MINH>
git commit -m "feat(orders): create order request flow"
git push -u origin <TEN_NHANH>
```

Sau đó tạo Pull Request vào `develop`, không vào `main`.

## E. Đồng bộ khi develop có thay đổi

```bash
git switch develop
git pull origin develop
git switch <TEN_NHANH_CUA_MINH>
git merge develop
```

Giải quyết conflict trên nhánh cá nhân, chạy lại build/test rồi push. Không dùng force push để che lịch sử.

## F. Tích hợp cuối

Trưởng nhóm tạo `fix/final-integration` từ `develop`, chỉ commit phần sửa tích hợp/Docker/deploy. Sau khi ổn định:

1. PR `fix/final-integration` -> `develop`.
2. Chạy CI và demo trên `develop`.
3. PR `develop` -> `main`.

Lịch sử đóng góp của từng người vẫn còn vì `main` nhận toàn bộ commit đã merge từ `develop`.

