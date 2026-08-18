using System.Text;
using CloudService.Infrastructure.QRCode;
using Xunit;

namespace CloudService.Application.Tests;

public sealed class QrCodeGeneratorTests
{
    [Fact]
    public void Generator_returns_a_svg_data_url_for_a_public_plan_url()
    {
        var dataUrl = new SvgQrCodeGenerator().CreateSvgDataUrl("http://localhost:3000/services/cloud-vps-basic");

        Assert.StartsWith("data:image/svg+xml;base64,", dataUrl);
        var svg = Encoding.UTF8.GetString(Convert.FromBase64String(dataUrl[(dataUrl.IndexOf(',') + 1)..]));
        Assert.Contains("<svg", svg, StringComparison.Ordinal);
        Assert.Contains("role=\"img\"", svg, StringComparison.Ordinal);
    }

    [Fact]
    public void Generator_supports_a_longer_url_that_requires_a_higher_qr_version()
    {
        var content = "https://cloudservice.example.com/services/" + new string('a', 20);

        var dataUrl = new SvgQrCodeGenerator().CreateSvgDataUrl(content);

        Assert.StartsWith("data:image/svg+xml;base64,", dataUrl);
        Assert.NotEmpty(Convert.FromBase64String(dataUrl[(dataUrl.IndexOf(',') + 1)..]));
    }
}
