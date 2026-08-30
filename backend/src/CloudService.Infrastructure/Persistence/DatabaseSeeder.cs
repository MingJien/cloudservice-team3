using CloudService.Application.Features.Auth.Interfaces;
using CloudService.Domain.Constants;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace CloudService.Infrastructure.Persistence;

public sealed class DatabaseSeeder(
    ApplicationDbContext dbContext,
    IPasswordHasher passwordHasher,
    IConfiguration configuration)
{
    public async Task SeedDemoUsersAsync(CancellationToken cancellationToken = default)
    {
        if (!configuration.GetValue<bool>("Seed:DemoUsers:Enabled"))
        {
            return;
        }

        await SeedUserAsync("Admin", RoleNames.Admin, cancellationToken);
        await SeedUserAsync("Editor", RoleNames.Editor, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        var partner = await SeedSilverAffiliateDemoAsync(cancellationToken);
        await ConsolidateLegacyAffiliateDemoAsync(partner.Id, cancellationToken);
        await SeedAffiliateLedgerDemoAsync(partner.Id, cancellationToken);
    }

    public async Task SeedDemoContentAsync(CancellationToken cancellationToken = default)
    {
        if (!configuration.GetValue<bool>("Seed:DemoContent:Enabled"))
        {
            return;
        }

        var category = await dbContext.NewsCategories.SingleOrDefaultAsync(item => item.Slug == "cloud-operations", cancellationToken);
        if (category is null)
        {
            category = new NewsCategory("Vận hành cloud", "cloud-operations");
            category.Update(category.Name, category.Slug, "Kiến thức triển khai và vận hành hạ tầng cloud.");
            dbContext.NewsCategories.Add(category);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        await SeedArticleAsync(
            category.Id,
            "Checklist triển khai VPS: 12 điểm phải khóa trước khi mở traffic",
            "checklist-trien-khai-vps",
            "Quy trình thực hành từ SSH, firewall, backup đến rollback để một VPS mới không trở thành điểm lỗi đơn lẻ.",
            ChecklistVpsContent,
            "/images/blog/vps-deployment-checklist.png",
            DateTime.UtcNow.AddDays(-2),
            cancellationToken);

        await SeedArticleAsync(
            category.Id,
            "Chọn chu kỳ Cloud/VPS bằng tổng chi phí, không bằng nhãn giảm giá",
            "chon-chu-ky-gia-cloud",
            "Một cách đọc báo giá theo workload, điểm hòa vốn và chi phí thoát để chọn tháng, quý hay năm có căn cứ.",
            CloudPricingContent,
            "/images/blog/cloud-pricing-cycle.png",
            DateTime.UtcNow.AddDays(-1),
            cancellationToken);

        // Keep two additional editorial records in the demo database so the
        // blog looks populated on first deploy. SeedArticleAsync only creates
        // missing slugs (or upgrades the original short demo placeholders),
        // therefore an editor's later edits are never overwritten on restart.
        await SeedArticleAsync(
            category.Id,
            "Observability thực chiến: đọc tín hiệu trước khi người dùng báo lỗi",
            "observability-thuc-chien-doc-tin-hieu",
            "Một runbook ngắn để nối health check, trace ID, p95 và hành động xử lý thành một vòng phản hồi có thể kiểm chứng.",
            ObservabilityRunbookContent,
            "/images/blog/observability-runbook.png",
            DateTime.UtcNow.AddDays(-4),
            cancellationToken);

        await SeedArticleAsync(
            category.Id,
            "Bảo vệ API SaaS bằng các lớp kiểm soát có thể kiểm toán",
            "bao-ve-api-saas-co-the-kiem-toan",
            "Từ cookie HttpOnly đến rate limit và idempotency: thiết kế phòng thủ để một request lặp không biến thành sự cố thương mại.",
            ApiSecurityContent,
            "/images/blog/api-security-gateway.png",
            DateTime.UtcNow.AddDays(-3),
            cancellationToken);

        await SeedPublicQnaAsync(cancellationToken);
        await SeedApprovedOrderTestimonialAsync(cancellationToken);

        // Older fixtures allowed an administrator-authored marketing quote.
        // Keep it as hidden audit history, but never publish it as customer proof.
        var legacyAdminTestimonial = await dbContext.Testimonials.SingleOrDefaultAsync(item => item.CustomerName == "Demo Workspace", cancellationToken);
        legacyAdminTestimonial?.Hide();

        const string legacyFlashDescription = "Khuyến mãi demo có thời hạn thật để kiểm thử countdown; không tự gia hạn sau khi hết hạn.";
        var legacyFlash = await dbContext.Promotions.SingleOrDefaultAsync(item => item.Code == "FLASH20", cancellationToken);
        if (legacyFlash is not null && string.Equals(legacyFlash.Description, legacyFlashDescription, StringComparison.Ordinal))
        {
            legacyFlash.SetActive(false);
        }

        if (!await dbContext.Promotions.AnyAsync(item => item.Code == "FLASH45", cancellationToken))
        {
            var utcNow = DateTime.UtcNow;
            var promotion = new Promotion(
                "FLASH45",
                "Flash Sale 45% gói nổi bật",
                DiscountType.Percentage,
                45m,
                utcNow.AddHours(-1),
                utcNow.AddDays(7));
            promotion.Update(
                promotion.Code,
                promotion.Name,
                promotion.DiscountType,
                promotion.DiscountValue,
                promotion.StartAt,
                promotion.EndAt,
                200,
                "Flash Sale demo giới hạn 200 yêu cầu, có thời hạn thật để kiểm thử countdown; không tự gia hạn.");
            dbContext.Promotions.Add(promotion);
            await dbContext.SaveChangesAsync(cancellationToken);
            dbContext.PromotionServicePlans.Add(new PromotionServicePlan(promotion.Id, 1));
        }

        if (!await dbContext.AffiliatePartners.AnyAsync(item => item.Code == "KOL123", cancellationToken))
        {
            var application = await dbContext.AffiliateApplications
                .SingleOrDefaultAsync(item => item.Email == "affiliate.demo@cloudservice.local", cancellationToken);
            if (application is null)
            {
                application = new AffiliateApplication("AFF-DEMO-KOL2026", "Đối tác Demo KOL", "affiliate.demo@cloudservice.local", "0900000000");
                application.SetDetails("https://example.com/cloud-review", "Dữ liệu mẫu để trình diễn attribution ?ref=KOL123.");
                application.ChangeStatus(AffiliateApplicationStatus.Processing, "Hồ sơ demo đã được tiếp nhận.");
                application.ChangeStatus(AffiliateApplicationStatus.Done, "Đối tác demo đã được duyệt.");
                dbContext.AffiliateApplications.Add(application);
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            dbContext.AffiliatePartners.Add(new AffiliatePartner(application.Id, "KOL123", application.FullName, 10m));
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task SeedPublicQnaAsync(CancellationToken cancellationToken)
    {
        // These records deliberately exercise both staff responder roles and
        // the parent/follow-up relationship shown by the public Q&A feed.
        // Tracking codes are stable, making the seed idempotent across every
        // Docker/Quick-Tunnel restart while leaving real customer questions
        // untouched.
        await SeedQuestionThreadAsync(
            rootTrackingCode: "REQ-DEMO-QNA-01",
            rootName: "Minh Anh",
            rootEmail: "qna.demo01@cloudservice.local",
            subject: "Cloud VPS Basic",
            question: "Gói Cloud VPS Basic có phù hợp website bán hàng khoảng 10.000 lượt truy cập mỗi tháng không?",
            rootReply: "Phù hợp ở giai đoạn khởi đầu. Bạn nên bắt đầu bằng cấu hình hiện tại, bật theo dõi p95 và đặt ngưỡng nâng RAM khi mức dùng ổn định vượt 70%. Admin có thể lập báo giá theo đúng chu kỳ trước khi gửi đơn.",
            rootResponder: ContactResponderRole.Admin,
            followUpTrackingCode: "REQ-DEMO-QNA-01-F1",
            followUpName: "Minh Anh",
            followUpEmail: "qna.demo01@cloudservice.local",
            followUpMessage: "Nếu traffic tăng đột biến trong chiến dịch ngắn thì có cần đổi gói ngay không?",
            followUpReply: "Chưa cần đổi ngay. Hãy theo dõi CPU, RAM và latency trong đỉnh tải; nếu vượt ngưỡng đã đặt thì gửi yêu cầu nâng cấp. Editor sẽ hỗ trợ ghi nhận nhu cầu và chuyển đúng đội vận hành.",
            followUpResponder: ContactResponderRole.Editor,
            cancellationToken);

        await SeedQuestionThreadAsync(
            rootTrackingCode: "REQ-DEMO-QNA-02",
            rootName: "Thuỳ Dương",
            rootEmail: "qna.demo02@cloudservice.local",
            subject: "Business Hosting",
            question: "Mã khuyến mãi được kiểm tra lại ở bước gửi đơn hay chỉ hiển thị trên giao diện?",
            rootReply: "Backend kiểm tra lại mã, thời hạn, phạm vi gói và hạn mức ngay trong transaction tạo đơn. Giao diện chỉ hiển thị báo giá tạm thời nên giá trị cuối cùng luôn có thể truy vết.",
            rootResponder: ContactResponderRole.Editor,
            followUpTrackingCode: "REQ-DEMO-QNA-02-F1",
            followUpName: "Thuỳ Dương",
            followUpEmail: "qna.demo02@cloudservice.local",
            followUpMessage: "Nếu bấm gửi hai lần vì mạng chậm thì hệ thống có tạo hai đơn không?",
            followUpReply: "Không. Idempotency-Key được lưu cùng kết quả trả về; lần gửi lặp lại nhận đúng response đã chốt thay vì tạo thêm đơn. Admin có thể kiểm tra trace và audit nếu cần.",
            followUpResponder: ContactResponderRole.Admin,
            cancellationToken);
    }

    private async Task SeedQuestionThreadAsync(
        string rootTrackingCode,
        string rootName,
        string rootEmail,
        string subject,
        string question,
        string rootReply,
        ContactResponderRole rootResponder,
        string followUpTrackingCode,
        string followUpName,
        string followUpEmail,
        string followUpMessage,
        string followUpReply,
        ContactResponderRole followUpResponder,
        CancellationToken cancellationToken)
    {
        var root = await dbContext.ContactRequests
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(item => item.TrackingCode == rootTrackingCode, cancellationToken);
        if (root is null)
        {
            root = new ContactRequest(rootTrackingCode, rootName, rootEmail, subject, question);
            root.Reply(rootReply, rootResponder);
            dbContext.ContactRequests.Add(root);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var followUpExists = await dbContext.ContactRequests
            .IgnoreQueryFilters()
            .AnyAsync(item => item.TrackingCode == followUpTrackingCode, cancellationToken);
        if (followUpExists || root.Status != ContactRequestStatus.Replied) return;

        var followUp = new ContactRequest(followUpTrackingCode, followUpName, followUpEmail, subject, followUpMessage);
        followUp.AttachToPublicQuestion(root);
        followUp.Reply(followUpReply, followUpResponder);
        dbContext.ContactRequests.Add(followUp);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task SeedArticleAsync(
        int categoryId,
        string title,
        string slug,
        string summary,
        string content,
        string thumbnailUrl,
        DateTime publishedAt,
        CancellationToken cancellationToken)
    {
        var article = await dbContext.NewsArticles.SingleOrDefaultAsync(item => item.Slug == slug, cancellationToken);
        var isNew = article is null;
        article ??= new NewsArticle(categoryId, title, slug, content);

        // Only upgrade the original short demo records. Once an editor has real content,
        // startup seeding must never overwrite or silently republish their work.
        var isLegacyDemo = string.Equals(article.AuthorName, "MekongNode Engineering", StringComparison.Ordinal)
            && article.Content.Length < 800;
        if (isNew || isLegacyDemo)
        {
            article.Update(categoryId, title, slug, summary, content, thumbnailUrl, "MekongNode Engineering");
            if (!article.IsPublished) article.Publish(publishedAt);
        }

        if (isNew) dbContext.NewsArticles.Add(article);
    }

    private const string ChecklistVpsContent = """
# Đừng mở cổng 80 trước khi biết cách quay lui

Một VPS mới thường tạo cảm giác “đã xong” ngay khi SSH vào được. Thực tế, máy chỉ sẵn sàng phục vụ khi nhóm trả lời được ba câu hỏi: **ai được phép truy cập**, **dữ liệu nào phải khôi phục được**, và **mất bao lâu để quay về phiên bản ổn định**. Checklist dưới đây là cách nhóm MekongNode dùng để biến một lần cài đặt thủ công thành quy trình có thể kiểm tra.

> Bài viết là tài liệu kỹ thuật của đồ án. Các mốc hiệu năng cần được đo lại trên hạ tầng triển khai thật.

## 1. Ghi lại cấu hình gốc và người chịu trách nhiệm

Trước khi cài dịch vụ, lưu vùng máy chủ, image hệ điều hành, vCPU, RAM, dung lượng đĩa, IP và người có quyền phê duyệt thay đổi. Đây là baseline để điều tra khi cấu hình thực tế lệch khỏi đơn hàng. Không gửi mật khẩu, private key hay chuỗi kết nối qua nhóm chat.

## 2. Khóa đường đăng nhập quản trị

- Tạo tài khoản vận hành riêng, không dùng chung một user cho cả nhóm.
- Dùng SSH key; tắt đăng nhập mật khẩu sau khi đã kiểm tra key dự phòng.
- Chặn đăng nhập trực tiếp bằng `root`, giới hạn nguồn IP nếu điều kiện cho phép.
- Lưu fingerprint của host key để phát hiện máy bị thay thế ngoài kế hoạch.

Thay đổi SSH phải mở một phiên thứ hai để kiểm tra trước khi đóng phiên hiện tại. Cách nhỏ này tránh tự khóa cả đội khỏi máy chủ.

## 3. Firewall theo nguyên tắc mặc định từ chối

Chỉ mở cổng ứng dụng thực sự sử dụng. Cổng database và dashboard quan sát không nên lộ trực tiếp ra Internet. Nếu có reverse proxy, web app chỉ cần nhận traffic nội bộ từ proxy; health endpoint readiness cũng cần phạm vi truy cập phù hợp.

```text
Internet -> 80/443 -> Reverse proxy -> Application
Operator -> VPN/Bastion -> SSH
Application -> private network -> Database
```

## 4. Vá hệ điều hành nhưng không cập nhật mù

Chụp snapshot hoặc xác nhận backup trước một đợt cập nhật lớn. Đọc danh sách package, ghi thời điểm và giữ cửa sổ rollback. Tự động vá bảo mật là cần thiết, nhưng reboot ngoài kế hoạch cũng có thể làm gián đoạn dịch vụ nếu app chưa có cơ chế tự khởi động.

## 5. Chạy ứng dụng bằng danh tính ít quyền

Process web không chạy bằng root. Thư mục binary chỉ cho pipeline ghi; thư mục upload và log có quyền riêng. Secret lấy từ biến môi trường hoặc secret store, không commit vào repository và không in trong log lỗi.

## 6. TLS, domain và thời hạn chứng thư

Kiểm tra DNS trước khi cấp chứng thư, ép HTTPS sau khi đường dẫn callback đã đúng, và theo dõi ngày hết hạn. Với API, CORS phải liệt kê origin cụ thể; “cho phép mọi origin” không phải cách sửa lỗi kết nối frontend.

## 7. Backup phải đi cùng bài kiểm tra restore

Một file backup chưa từng phục hồi chỉ là niềm tin. Nhóm cần xác định RPO, RTO, nơi giữ bản sao ngoài máy chính và lịch diễn tập restore. Với SQL Server, kiểm tra cả schema migration lẫn dữ liệu nghiệp vụ sau phục hồi.

## 8. Log có cấu trúc và mã tương quan

Mỗi request nên có trace ID để nối lỗi frontend với log backend. Không ghi email, số điện thoại, token hoặc payload nhạy cảm ở mức thông tin. Với hành động quản trị, audit log cần trả lời ai đổi, đổi bản ghi nào, thời điểm nào và từ trạng thái nào.

## 9. Health check tách liveness và readiness

Liveness trả lời process còn sống; readiness xác nhận dependency thiết yếu như database sẵn sàng. Nếu gộp hai khái niệm, orchestrator có thể khởi động lại một process khỏe chỉ vì database tạm chậm, làm sự cố lớn hơn.

## 10. Đặt ngưỡng quan sát trước khi có sự cố

Theo dõi CPU, RAM, disk, error rate, latency p95 và số kết nối database. Ngưỡng cảnh báo phải gắn với hành động: ai nhận, kiểm tra dashboard nào và bao lâu thì escalation. Con số đẹp trên landing page không thay thế telemetry thật.

## 11. Kiểm tra tải theo hành vi người dùng

Đừng chỉ bắn request vào `/health`. Kịch bản nên gồm tải danh mục, tính giá, tạo yêu cầu có idempotency key và tra cứu đơn. Đo cả tỷ lệ lỗi, p95/p99 và mức sử dụng pool kết nối để tìm nút thắt thực sự.

## 12. Viết rollback trước khi bấm deploy

Chốt phiên bản ổn định gần nhất, migration nào có thể đảo, dữ liệu nào không thể mất và điều kiện dừng rollout. Sau deploy, chạy smoke test từ bên ngoài: trang public, API health/readiness, tạo một yêu cầu thử và kiểm tra audit/notification.

## Bảng kết thúc ca triển khai

1. Access đã dùng key và có tài khoản dự phòng.
2. Firewall chỉ mở đúng cổng, database không public.
3. Backup gần nhất đã được xác minh khả năng restore.
4. Secret không nằm trong mã nguồn hoặc log.
5. Dashboard, cảnh báo và người trực đã rõ.
6. Rollback có phiên bản, người quyết định và thời hạn.

Nếu một dòng chưa có bằng chứng, trạng thái phù hợp là **chưa sẵn sàng**, không phải “chắc sẽ ổn”. Đó cũng là khác biệt giữa demo giao diện và một quy trình vận hành có trách nhiệm.
""";

    private const string CloudPricingContent = """
# Giá rẻ theo tháng có thể đắt ở tháng thứ sáu

Khi so sánh gói Cloud/VPS, phần dễ nhìn nhất là tỷ lệ giảm giá. Phần quyết định ngân sách lại nằm ở workload: chạy bao lâu, tăng giảm ra sao, dữ liệu rời hệ thống tốn gì và đội vận hành phải bỏ bao nhiêu giờ. Vì vậy MekongNode coi báo giá là một **kết quả có thời điểm hiệu lực**, không phải con số được hard-code trên card.

## Bắt đầu bằng hồ sơ workload

Trước khi chọn chu kỳ, ghi lại bốn nhóm dữ liệu:

- **Nhu cầu nền:** vCPU, RAM, NVMe và băng thông tối thiểu để app không nghẽn.
- **Độ biến động:** traffic theo giờ, mùa cao điểm, chiến dịch và mức tăng dự kiến.
- **Tính quan trọng:** thời gian gián đoạn chấp nhận được, RPO/RTO và nhu cầu support.
- **Khả năng rời đi:** dung lượng cần xuất, định dạng backup và thời gian chuyển nhà cung cấp.

Một website giới thiệu có traffic đều khác hẳn môi trường thử nghiệm chỉ chạy hai tuần. Ép cả hai vào cùng cam kết một năm thường tạo “tiết kiệm ảo”.

## Tính tổng chi phí thay vì nhìn giá niêm yết

Công thức tối thiểu nên gồm:

```text
TCO = compute + storage + bandwidth + backup
    + license + support + thời gian vận hành
    + chi phí chuyển đổi dự kiến
```

Ví dụ một gói năm giảm 20% nhưng workload cần nâng RAM sau ba tháng. Nếu chính sách không cho đổi cấu hình hoặc hoàn phần còn lại, khoản giảm có thể thấp hơn chi phí bị khóa. Ngược lại, workload ổn định và đã đo tải đủ lâu thường hưởng lợi từ cam kết dài hơn.

## Khi nào nên chọn thanh toán tháng?

Chu kỳ tháng phù hợp khi sản phẩm còn thử nghiệm, chưa biết tải ổn định hoặc có khả năng đổi kiến trúc. Phần chênh lệch giá là “phí mua thông tin”: đội có thời gian quan sát metric thật trước khi cam kết.

Nên đặt điểm đánh giá lại sau 30 hoặc 60 ngày. Nếu CPU/RAM, tăng trưởng dữ liệu và băng thông đã ổn định, nhóm mới so sánh phương án quý/năm bằng cùng một snapshot giá.

## Khi nào cam kết quý hoặc năm hợp lý?

Cam kết dài có cơ sở khi:

1. Dịch vụ đã chạy qua ít nhất một chu kỳ cao điểm.
2. Quyền nâng/hạ cấu hình, hoàn tiền và chuyển gói được viết rõ.
3. Backup có thể phục hồi ngoài máy chính.
4. Ngân sách đã tính VAT, license, IP, snapshot và traffic vượt mức.
5. Mức giảm còn có hiệu lực tại thời điểm backend xác nhận đơn.

Nếu nhà cung cấp chỉ đưa phần trăm giảm mà không đưa điều kiện, đó chưa phải một báo giá đủ để quyết định.

## Khuyến mãi phải có biên an toàn

Một promotion thực tế cần ngày bắt đầu/kết thúc, phạm vi gói, số lượt sử dụng, giá trị đơn tối thiểu và mức giảm tối đa. Backend phải kiểm tra lại tất cả điều kiện khi tạo yêu cầu; frontend chỉ trình bày kết quả. Cách này tránh hai tab trình duyệt dùng cùng ưu đãi sau khi hạn mức vừa hết.

Với phần trăm giảm, `MaxDiscountAmount` bảo vệ biên lợi nhuận ở đơn lớn. Với mã giảm cố định, tổng tiền không được âm. Những invariant này nên có unit test thay vì phụ thuộc vào thao tác demo.

## Ba kịch bản để bảo vệ quyết định

### Kịch bản A — MVP ba tháng

Chọn tháng, ưu tiên khả năng đổi cấu hình. Dành ngân sách cho logging, backup và domain/TLS trước khi mua dư tài nguyên.

### Kịch bản B — website thương mại đã ổn định

So sánh quý và năm bằng tải p95, tốc độ tăng dữ liệu và chi phí support. Chỉ khóa dài khi điều khoản nâng cấp không làm mất phần đã trả.

### Kịch bản C — chiến dịch có đỉnh ngắn

Giữ baseline vừa đủ, dùng khả năng scale hoặc thuê thêm ngắn hạn. Mua cấu hình đỉnh cho cả năm thường lãng phí hơn phí linh hoạt.

## Checklist trước khi gửi yêu cầu

- Báo giá ghi rõ tiền tệ, chu kỳ và thời điểm hiệu lực.
- Giá khuyến mãi và giá gia hạn được tách riêng.
- Có mô tả giới hạn CPU, IOPS, băng thông và backup.
- Điều kiện hoàn tiền, hủy và di chuyển dữ liệu đọc được trước thanh toán.
- Mã đơn/idempotency ngăn gửi trùng khi mạng chập chờn.
- Kênh hỗ trợ và SLA phản hồi phù hợp mức quan trọng của workload.

Mục tiêu không phải chọn gói rẻ nhất trên màn hình. Mục tiêu là chọn cấu hình mà đội có thể **giải thích, theo dõi và thay đổi** khi dữ liệu vận hành đổi. Một hệ thống bán cloud đáng tin phải giúp khách hàng nhìn thấy các điều kiện đó trước khi họ gửi đơn.
""";

    private const string ObservabilityRunbookContent = """
# Observability thực chiến: đọc tín hiệu trước khi người dùng báo lỗi

Một dashboard đẹp không tự làm hệ thống đáng tin. Giá trị của observability nằm ở việc nối được **tín hiệu → quyết định → hành động** trong vài phút đầu của một sự cố. Bài viết này là runbook ngắn cho CloudService khi chạy sau reverse proxy.

> Số liệu minh họa trong bài chỉ là dữ liệu demo. Khi lên VPS, hãy thay bằng ngưỡng đo từ workload thật.

## Ba tín hiệu cần đọc cùng nhau

- **Liveness** trả lời process còn sống; nó không khẳng định database đã sẵn sàng.
- **Readiness** kiểm tra dependency thiết yếu trước khi nhận traffic.
- **Latency và error rate** cho biết người dùng đang cảm nhận điều gì, đặc biệt là p95/p99 thay vì chỉ nhìn trung bình.

Khi một tín hiệu đỏ, trace ID phải nối được request từ Nginx đến API và bản ghi audit. Nhờ vậy người trực không phải đoán service nào đã làm thay đổi kết quả.

## Một vòng phản hồi có thể kiểm chứng

```text
request -> trace-id -> metric -> alert -> runbook -> audit
```

1. Gắn mã tương quan vào response và log có cấu trúc.
2. Đặt ngưỡng cảnh báo có chủ sở hữu, thời gian phản hồi và điều kiện escalation.
3. Kiểm tra readiness sau mỗi lần rollout; nếu database chưa sẵn sàng, proxy không được quảng bá bản phát hành mới.
4. Ghi lại nguyên nhân và hành động khắc phục vào audit, không sửa trực tiếp dữ liệu để “làm đẹp” dashboard.

## Checklist ca trực

- [ ] Xác nhận lỗi có tái hiện từ public URL hay chỉ xảy ra trong mạng nội bộ.
- [ ] Đọc p95, tỷ lệ 5xx và số kết nối SQL trong cùng một khoảng thời gian.
- [ ] Kiểm tra outbox còn Pending/DeadLetter trước khi kết luận Telegram bị mất.
- [ ] Chụp lại phiên bản image và migration trước khi rollback.
- [ ] Sau khi ổn định, chạy lại health, tạo một yêu cầu thử và lưu trace vào biên bản bàn giao.

Observability tốt không hứa rằng sự cố sẽ không xảy ra. Nó chứng minh đội ngũ biết **phát hiện, giới hạn ảnh hưởng và khôi phục** bằng dữ liệu có thể kiểm toán.
""";

    private const string ApiSecurityContent = """
# Bảo vệ API SaaS bằng các lớp kiểm soát có thể kiểm toán

API public phải giả định rằng trình duyệt, mạng và request đều có thể bị thao túng. Phòng thủ tốt không nằm ở một middleware duy nhất; nó là chuỗi kiểm soát có thể giải thích khi giảng viên hoặc khách hàng hỏi “vì sao request này được chấp nhận?”.

## Bốn lớp phòng thủ

1. **Biên proxy:** Nginx chỉ công khai cổng web; database và API nội bộ không mở thẳng ra Internet.
2. **Phiên:** cookie HttpOnly/SameSite giữ session, refresh token được xoay vòng và token bị thu hồi được chặn ở backend.
3. **Nghiệp vụ:** giá được tính lại trong transaction, mã khuyến mãi có giới hạn, còn `Idempotency-Key` ngăn gửi trùng.
4. **Bằng chứng:** audit log lưu ai, bản ghi nào, thời điểm nào và trace ID; không ghi password hay token.

## Request lặp không được biến thành đơn lặp

```text
client retry -> hash(key + payload) -> unique reservation
           -> calculate + persist -> cache response -> return same result
```

Nếu cùng một khóa đi kèm payload khác, API trả `409 Conflict`. Nếu payload giống nhau, lần retry nhận lại response đã chốt. Đây là ranh giới quan trọng giữa “bấm nút hai lần” và “tạo hai nghĩa vụ thương mại”.

## Đừng tin giá ở phía client

Frontend chỉ xin một quote có chữ ký và thời hạn ngắn. Khi tạo đơn, backend đọc catalog và promotion ngay trong transaction; quote cũ hoặc giá vừa đổi sẽ bị từ chối để khách lập lại báo giá. Cách này xử lý đúng race condition giữa hai tab trình duyệt.

## Checklist trước khi mở traffic

- [ ] CORS chỉ cho origin đã biết, không dùng wildcard khi có credential.
- [ ] Rate limit theo IP cho login, referral và tạo đơn.
- [ ] Payload có giới hạn độ dài; lỗi trả về Problem Details kèm trace ID.
- [ ] Outbox giữ sự kiện cho tới khi Telegram xác nhận HTTP 2xx.
- [ ] Secret lấy từ environment/secret store và nhóm log transport không được in URL chứa token.

Bảo mật có thể bán được là bảo mật **đo được và truy vết được**. Mỗi lớp trên đều để lại một dấu hiệu kiểm tra, thay vì chỉ là lời hứa trong tài liệu.
""";

    private async Task SeedUserAsync(string sectionName, string roleName, CancellationToken cancellationToken)
    {
        var section = configuration.GetSection($"Seed:DemoUsers:{sectionName}");
        var userName = section["UserName"];
        var fullName = section["FullName"];
        var email = section["Email"];
        var password = section["Password"];

        if (new[] { userName, fullName, email, password }.Any(string.IsNullOrWhiteSpace))
        {
            throw new InvalidOperationException($"Demo user seed '{sectionName}' is enabled but its environment variables are incomplete.");
        }

        var existingUser = await dbContext.AppUsers
            .SingleOrDefaultAsync(user => user.UserName == userName || user.Email == email, cancellationToken);
        if (existingUser is not null)
        {
            if (configuration.GetValue<bool>("Seed:DemoUsers:ResetPasswordOnStartup"))
            {
                var utcNow = DateTime.UtcNow;
                existingUser.ChangePasswordHash(passwordHasher.Hash(password!), utcNow);
                var activeTokens = await dbContext.RefreshTokens
                    .Where(token => token.UserId == existingUser.Id && token.RevokedAt == null && token.ExpiresAt > utcNow)
                    .ToArrayAsync(cancellationToken);
                foreach (var activeToken in activeTokens)
                {
                    activeToken.Revoke(utcNow);
                }
            }

            return;
        }

        var role = await dbContext.Roles.SingleAsync(item => item.Name == roleName, cancellationToken);
        dbContext.AppUsers.Add(new AppUser(userName!, fullName!, email!, passwordHasher.Hash(password!), role.Id));
    }

    private async Task SeedApprovedOrderTestimonialAsync(CancellationToken cancellationToken)
    {
        // Existing demo databases used the retired aff2 fixture code. Support it
        // during the one-time consolidation, while all fresh demo records use
        // the affb identity that a reviewer actually signs in with.
        var order = await dbContext.OrderRequests.SingleOrDefaultAsync(item => item.TrackingCode == "ORD-AFFB-01", cancellationToken)
            ?? await dbContext.OrderRequests.SingleOrDefaultAsync(item => item.TrackingCode == "ORD-AFF2-01", cancellationToken);
        if (order is null || await dbContext.Testimonials.AnyAsync(item => item.OrderRequestId == order.Id, cancellationToken))
        {
            return;
        }

        // The seed uses a real completed demo order instead of a hand-authored
        // marketing record so the public "verified order" badge remains backed
        // by the same lifecycle rule used for customer submissions.
        var testimonial = Testimonial.CreateFromCompletedOrder(
            order,
            "Đội ngũ cập nhật tiến độ rõ ràng, bàn giao cấu hình có checklist nên bộ phận kỹ thuật dễ tiếp nhận và theo dõi.",
            5);
        testimonial.SetActive(true);
        dbContext.Testimonials.Add(testimonial);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task ConsolidateLegacyAffiliateDemoAsync(long survivingPartnerId, CancellationToken cancellationToken)
    {
        var legacyPartners = await dbContext.AffiliatePartners
            .Include(item => item.AppUser)
            .Where(item => item.Code == "AFF2GOLD" || item.Code == "AFF2SILVER" || item.Code == "AFF2-RETIRED")
            .OrderBy(item => item.Id)
            .ToArrayAsync(cancellationToken);
        if (legacyPartners.Length == 0) return;

        var utcNow = DateTime.UtcNow;
        foreach (var legacyPartner in legacyPartners.Where(item => item.Id != survivingPartnerId))
        {
            // The old aff2 sample was used in earlier classroom databases. Move
            // financial evidence with set-based updates first, then retire its
            // login; deleting it would break auditable FK history and is unsafe.
            await dbContext.AffiliatePayouts
                .Where(item => item.AffiliatePartnerId == legacyPartner.Id)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(item => item.AffiliatePartnerId, survivingPartnerId), cancellationToken);
            await dbContext.AffiliateAttributions
                .Where(item => item.AffiliatePartnerId == legacyPartner.Id)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(item => item.AffiliatePartnerId, survivingPartnerId), cancellationToken);

            if (legacyPartner.AppUser is not null)
            {
                var activeTokens = await dbContext.RefreshTokens
                    .Where(item => item.UserId == legacyPartner.AppUser.Id && item.RevokedAt == null && item.ExpiresAt > utcNow)
                    .ToArrayAsync(cancellationToken);
                foreach (var activeToken in activeTokens)
                    activeToken.Revoke(utcNow);

                legacyPartner.AppUser.Deactivate(utcNow);
            }

            legacyPartner.ChangeCode(
                legacyPartners.Length == 1 ? "AFF2-RETIRED" : $"AFF2-RETIRED-{legacyPartner.Id}",
                utcNow);
            legacyPartner.Deactivate(utcNow);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task SeedAffiliateLedgerDemoAsync(long partnerId, CancellationToken cancellationToken)
    {
        var partner = await dbContext.AffiliatePartners.SingleAsync(item => item.Id == partnerId && item.Code == "AFFBSILVER" && item.IsActive, cancellationToken);

        if (await dbContext.AffiliateAttributions.AnyAsync(item => item.AffiliatePartnerId == partner.Id, cancellationToken))
        {
            await BackfillAffiliateDemoTimelineAsync(partner.Id, cancellationToken);
            return;
        }

        var price = await dbContext.PlanPrices.IgnoreQueryFilters().Include(item => item.ServicePlan).OrderBy(item => item.Id).FirstAsync(cancellationToken);
        var now = DateTime.UtcNow;
        var customers = new[] { "Trần Hoàng Minh", "Lê Văn Phúc", "Nguyễn Thảo Vy", "Phạm Quốc Anh", "Võ Minh Khang", "Đặng Gia Hân", "Bùi Thanh Tùng", "Hoàng Ngọc Mai", "Đỗ Đức Long", "Lý Khánh Linh", "Trương Anh Tú", "Ngô Nhật Nam", "Hồ Mai Anh", "Dương Quốc Bảo", "Mai Tường Vi" };
        var attributions = new List<AffiliateAttribution>();
        for (var index = 0; index < customers.Length; index++)
        {
            var unitPrice = index < 4 ? 4_166_666.67m : index < 11 ? 6_666_666.67m : 5_555_555.56m;
            var order = new OrderRequest(
                $"ORD-AFFB-{index + 1:00}",
                customers[index],
                $"customer{index + 1}@demo.local",
                $"09{index + 10:00000000}",
                price.ServicePlanId,
                price.Id,
                price.ServicePlan.Name,
                price.BillingCycle,
                unitPrice,
                0m);
            order.ChangeStatus(OrderRequestStatus.Processing, "Dữ liệu demo đã xác nhận thanh toán.");
            order.ChangeStatus(OrderRequestStatus.Done, "Đơn demo đã hoàn tất.");
            dbContext.OrderRequests.Add(order);
            // Snapshot the partner's persisted rate so the demo follows the
            // same immutable-commission rule as a customer-created order.
            var attribution = new AffiliateAttribution(partner, order, partner.Code, partner.CommissionRate);
            attribution.SetImportedCreatedAt(DemoTimelineDate(now, index));
            var completedAt = now.AddDays(-60 + index);
            attribution.ScheduleHold(index < 4 ? now.AddDays(10 + index) : completedAt.AddDays(30), completedAt);
            if (index >= 4) attribution.Mature(now);
            dbContext.AffiliateAttributions.Add(attribution);
            attributions.Add(attribution);
        }
        await dbContext.SaveChangesAsync(cancellationToken);

        var paid = attributions.Skip(11).ToArray();
        for (var payoutIndex = 0; payoutIndex < 2; payoutIndex++)
        {
            var group = paid.Skip(payoutIndex * 2).Take(2).ToArray();
            var requestedAt = now.AddDays(-45 + payoutIndex * 15);
            var payout = new AffiliatePayout(partner, $"PAY-DEMO-{payoutIndex + 1:00}", group.Sum(item => item.CommissionAmount), "Vietcombank", "0123456789", partner.DisplayName, requestedAt);
            dbContext.AffiliatePayouts.Add(payout);
            foreach (var attribution in group) attribution.ReserveForPayout(payout, requestedAt);
            payout.MarkPaid(1, "Đối soát demo đã hoàn tất qua chuyển khoản.", requestedAt.AddDays(1));
        }
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task BackfillAffiliateDemoTimelineAsync(long partnerId, CancellationToken cancellationToken)
    {
        var attributions = await dbContext.AffiliateAttributions
            .Include(item => item.OrderRequest)
            .Where(item => item.AffiliatePartnerId == partnerId &&
                (item.OrderRequest.TrackingCode.StartsWith("ORD-AFFB-") || item.OrderRequest.TrackingCode.StartsWith("ORD-AFF2-")))
            .OrderBy(item => item.OrderRequest.TrackingCode)
            .ToArrayAsync(cancellationToken);
        if (attributions.Length == 0) return;

        var now = DateTime.UtcNow;
        foreach (var (attribution, index) in attributions.Select((item, index) => (item, index)))
            attribution.SetImportedCreatedAt(DemoTimelineDate(now, index));

        // The affiliate fixture must exercise an actual time series, not a frontend
        // placeholder. Restricting the backfill to deterministic demo codes makes
        // the seed idempotent and guarantees no operational attribution is rewritten.
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static DateTime DemoTimelineDate(DateTime utcNow, int index) =>
        utcNow.Date.AddDays(-7 * (7 - index % 8) - index % 3).AddHours(9 + index % 7);

    private async Task<AffiliatePartner> SeedSilverAffiliateDemoAsync(CancellationToken cancellationToken)
    {
        var section = configuration.GetSection("Seed:DemoUsers:AffiliateSilver");
        var userName = section["UserName"];
        var fullName = section["FullName"];
        var email = section["Email"];
        var password = section["Password"];
        if (new[] { userName, fullName, email, password }.Any(string.IsNullOrWhiteSpace))
            throw new InvalidOperationException("Demo affiliate seed is enabled but its environment variables are incomplete.");

        var role = await dbContext.Roles.SingleAsync(item => item.Name == RoleNames.Affiliate, cancellationToken);
        var user = await dbContext.AppUsers.SingleOrDefaultAsync(item => item.UserName == userName || item.Email == email, cancellationToken);
        if (user is null)
        {
            user = new AppUser(userName!, fullName!, email!, passwordHasher.Hash(password!), role.Id);
            dbContext.AppUsers.Add(user);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        else if (configuration.GetValue<bool>("Seed:DemoUsers:ResetPasswordOnStartup"))
        {
            user.ChangePasswordHash(passwordHasher.Hash(password!), DateTime.UtcNow);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var application = await dbContext.AffiliateApplications.SingleOrDefaultAsync(item => item.Email == email, cancellationToken);
        if (application is null)
        {
            application = new AffiliateApplication("AFF-DEMO-SILVER-B", fullName!, email!, "0912450044");
            application.SetDetails("https://example.com/mekongnode-affb", "Hồ sơ đối tác Bạc độc lập để kiểm tra phân quyền dữ liệu Affiliate Portal.");
            application.ChangeStatus(AffiliateApplicationStatus.Processing, "Đã xác minh kênh demo.");
            application.ChangeStatus(AffiliateApplicationStatus.Done, "Đã duyệt tài khoản Bạc demo.");
            dbContext.AffiliateApplications.Add(application);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var partner = await dbContext.AffiliatePartners.SingleOrDefaultAsync(item => item.Code == "AFFBSILVER", cancellationToken);
        if (partner is null)
        {
            partner = new AffiliatePartner(application.Id, "AFFBSILVER", fullName!, 9m);
            partner.LinkAccount(user.Id);
            dbContext.AffiliatePartners.Add(partner);
        }
        else if (partner.AppUserId is not null && partner.AppUserId != user.Id)
            throw new InvalidOperationException("Partner demo AFFBSILVER đang liên kết với một tài khoản khác.");
        else if (partner.AppUserId is null)
        {
            partner.LinkAccount(user.Id);
        }

        // The monthly tier remains Silver even though the demo ledger contains
        // older paid orders. That mirrors the real policy: tier is determined by
        // this month's conversions, not by lifetime revenue shown in the portal.
        partner.ImportHistoricalCounters(318, 24);
        partner.EvaluateTier(24, DateTime.UtcNow);
        await dbContext.SaveChangesAsync(cancellationToken);
        return partner;
    }
}
