using Microsoft.AspNetCore.Http;

namespace CloudService.WebApi.Infrastructure;

internal static class ImageUploadValidator
{
    private static readonly IReadOnlyDictionary<string, string> AllowedContentTypes =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png",
            [".gif"] = "image/gif",
            [".webp"] = "image/webp"
        };

    public static async Task<(string? Extension, string? Error)> ValidateAsync(
        IFormFile? file,
        long maxBytes,
        string displayName,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return (null, $"Không tìm thấy file {displayName.ToLowerInvariant()} hợp lệ.");
        if (file.Length > maxBytes)
            return (null, $"Dung lượng {displayName.ToLowerInvariant()} tối đa là {maxBytes / 1024 / 1024} MB.");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedContentTypes.TryGetValue(extension, out var expectedContentType))
            return (null, $"{displayName} chỉ hỗ trợ JPG, PNG, GIF hoặc WEBP.");

        // Content-Type is advisory: browsers usually send it, while curl/PowerShell may use
        // application/octet-stream. The byte signature below is the authoritative check.
        var suppliedContentType = file.ContentType?.Split(';', 2)[0].Trim();
        if (!string.IsNullOrWhiteSpace(suppliedContentType) &&
            !string.Equals(suppliedContentType, "application/octet-stream", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(suppliedContentType, expectedContentType, StringComparison.OrdinalIgnoreCase))
        {
            return (null, "Định dạng nội dung của file không khớp với phần mở rộng.");
        }

        var header = new byte[12];
        await using var stream = file.OpenReadStream();
        var read = await stream.ReadAsync(header.AsMemory(0, header.Length), cancellationToken);
        var isValid = extension switch
        {
            ".jpg" or ".jpeg" => read >= 3 && header[0] == 0xff && header[1] == 0xd8 && header[2] == 0xff,
            ".png" => read >= 8 && header.AsSpan(0, 8).SequenceEqual(new byte[] { 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a }),
            ".gif" => read >= 6 && (header.AsSpan(0, 6).SequenceEqual("GIF87a"u8) || header.AsSpan(0, 6).SequenceEqual("GIF89a"u8)),
            ".webp" => read >= 12 && header.AsSpan(0, 4).SequenceEqual("RIFF"u8) && header.AsSpan(8, 4).SequenceEqual("WEBP"u8),
            _ => false
        };

        return isValid ? (extension, null) : (null, $"Nội dung file không phải là {displayName.ToLowerInvariant()} hợp lệ.");
    }
}
