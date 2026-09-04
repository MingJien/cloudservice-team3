using System.Text;
using CloudService.Application.Features.Services.Interfaces;
using QRCoder;

namespace CloudService.Infrastructure.QRCode;

/// <summary>
/// Generates standards-compliant, cross-platform SVG QR codes for public plan URLs.
/// Q-level error correction keeps the code readable when it is resized or printed.
/// </summary>
public sealed class SvgQrCodeGenerator : IQrCodeGenerator
{
    public string CreateSvgDataUrl(string content)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(content);

        using var data = QRCodeGenerator.GenerateQrCode(content.Trim(), QRCodeGenerator.ECCLevel.Q);
        using var renderer = new SvgQRCode(data);
        var svg = renderer.GetGraphic(
            pixelsPerModule: 8,
            darkColorHex: "#0B132B",
            lightColorHex: "#FFFFFF",
            drawQuietZones: true)
            .Replace("<svg ", "<svg role=\"img\" aria-label=\"QR code\" ", StringComparison.Ordinal);

        return "data:image/svg+xml;base64," + Convert.ToBase64String(Encoding.UTF8.GetBytes(svg));
    }

    public byte[] CreatePng(string content)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(content);

        using var data = QRCodeGenerator.GenerateQrCode(content.Trim(), QRCodeGenerator.ECCLevel.Q);
        using var renderer = new PngByteQRCode(data);
        return renderer.GetGraphic(pixelsPerModule: 12, drawQuietZones: true);
    }
}
