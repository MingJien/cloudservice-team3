using System.Globalization;
using System.IO.Compression;
using System.Security;
using System.Text;
using CloudService.Application.Features.Orders.Interfaces;
using CloudService.Application.Features.Orders.Models;
using CloudService.Domain.Entities;

namespace CloudService.Infrastructure.Excel;

/// <summary>
/// Creates a small standards-compliant Office Open XML workbook without coupling
/// the Application layer to an Excel vendor package. The generated file opens in
/// Excel, LibreOffice and Google Sheets import while keeping export deterministic.
/// </summary>
public sealed class OrderXlsxExportFormatter : IOrderExportFormatter
{
    private static readonly string[] Headers =
    [
        "Tracking code", "Customer", "Email", "Phone", "Service plan", "Billing cycle",
        "Unit price", "Discount", "Estimated amount", "Status", "Created at (UTC)"
    ];

    public OrderExportResult Create(IReadOnlyCollection<OrderRequest> orders, DateTime exportedAtUtc)
    {
        using var stream = new MemoryStream();
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            AddEntry(archive, "[Content_Types].xml", ContentTypes());
            AddEntry(archive, "_rels/.rels", RootRelationships());
            AddEntry(archive, "xl/workbook.xml", Workbook());
            AddEntry(archive, "xl/_rels/workbook.xml.rels", WorkbookRelationships());
            AddEntry(archive, "xl/worksheets/sheet1.xml", Worksheet(orders));
        }

        return new OrderExportResult(
            stream.ToArray(),
            $"order-requests-{exportedAtUtc:yyyyMMddHHmmss}.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }

    private static string Worksheet(IReadOnlyCollection<OrderRequest> orders)
    {
        var rowCount = orders.Count + 1;
        var builder = new StringBuilder($"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><dimension ref=\"A1:K{rowCount}\"/><sheetViews><sheetView workbookViewId=\"0\" showGridLines=\"0\"/></sheetViews><sheetData>");
        builder.Append("<row r=\"1\">");
        for (var index = 0; index < Headers.Length; index++) builder.Append(InlineStringCell(index, 1, Headers[index]));
        builder.Append("</row>");

        var rowNumber = 2;
        foreach (var order in orders)
        {
            builder.Append($"<row r=\"{rowNumber}\">");
            builder.Append(InlineStringCell(0, rowNumber, order.TrackingCode));
            builder.Append(InlineStringCell(1, rowNumber, order.CustomerName));
            builder.Append(InlineStringCell(2, rowNumber, order.Email));
            builder.Append(InlineStringCell(3, rowNumber, order.Phone));
            builder.Append(InlineStringCell(4, rowNumber, order.PlanNameSnapshot));
            builder.Append(InlineStringCell(5, rowNumber, order.BillingCycleSnapshot.ToString()));
            builder.Append(NumberCell(6, rowNumber, order.UnitPrice));
            builder.Append(NumberCell(7, rowNumber, order.DiscountAmount));
            builder.Append(NumberCell(8, rowNumber, order.EstimatedAmount));
            builder.Append(InlineStringCell(9, rowNumber, order.Status.ToString()));
            builder.Append(InlineStringCell(10, rowNumber, order.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture)));
            builder.Append("</row>");
            rowNumber++;
        }

        builder.Append($"</sheetData><autoFilter ref=\"A1:K{rowCount}\"/></worksheet>");
        return builder.ToString();
    }

    private static string InlineStringCell(int column, int row, string value)
    {
        var address = $"{ColumnName(column)}{row}";
        var escaped = SecurityElement.Escape(value) ?? string.Empty;
        return $"<c r=\"{address}\" t=\"inlineStr\"><is><t xml:space=\"preserve\">{escaped}</t></is></c>";
    }

    private static string NumberCell(int column, int row, decimal value) =>
        $"<c r=\"{ColumnName(column)}{row}\"><v>{value.ToString(CultureInfo.InvariantCulture)}</v></c>";

    private static string ColumnName(int zeroBasedColumn)
    {
        var result = string.Empty;
        var value = zeroBasedColumn + 1;
        while (value > 0)
        {
            value--;
            result = (char)('A' + value % 26) + result;
            value /= 26;
        }
        return result;
    }

    private static void AddEntry(ZipArchive archive, string path, string content)
    {
        using var writer = new StreamWriter(archive.CreateEntry(path).Open(), new UTF8Encoding(false));
        writer.Write(content);
    }

    private static string ContentTypes() => "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/></Types>";

    private static string RootRelationships() => "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>";

    private static string Workbook() => "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><sheets><sheet name=\"Order requests\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>";

    private static string WorkbookRelationships() => "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/></Relationships>";
}
