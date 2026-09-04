using System.IO.Compression;
using System.Text;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using CloudService.Infrastructure.Excel;
using Xunit;

namespace CloudService.Application.Tests;

public sealed class OrderXlsxExportFormatterTests
{
    [Fact]
    public void Create_generates_readable_open_xml_workbook_with_numeric_and_unicode_cells()
    {
        var order = new OrderRequest(
            "MN-EXPORT-001",
            "Nguyễn Văn A",
            "customer@example.com",
            "0900000000",
            1,
            1,
            "Cloud VPS Basic",
            BillingCycle.Monthly,
            590000m,
            100000m);

        var result = new OrderXlsxExportFormatter().Create([order], DateTime.UtcNow);

        Assert.Equal("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", result.ContentType);
        Assert.EndsWith(".xlsx", result.FileName, StringComparison.Ordinal);

        using var archive = new ZipArchive(new MemoryStream(result.Content), ZipArchiveMode.Read);
        var entry = archive.GetEntry("xl/worksheets/sheet1.xml");
        Assert.NotNull(entry);

        using var reader = new StreamReader(entry!.Open(), Encoding.UTF8);
        var worksheet = reader.ReadToEnd();

        Assert.Contains("Tracking code", worksheet, StringComparison.Ordinal);
        Assert.Contains("Nguyễn Văn A", worksheet, StringComparison.Ordinal);
        Assert.Contains("<v>490000</v>", worksheet, StringComparison.Ordinal);
        Assert.NotNull(archive.GetEntry("[Content_Types].xml"));
        Assert.NotNull(archive.GetEntry("xl/workbook.xml"));
    }
}
