namespace CloudService.Application.Features.Services.Interfaces;

public interface IQrCodeGenerator
{
    string CreateSvgDataUrl(string content);
    byte[] CreatePng(string content);
}
