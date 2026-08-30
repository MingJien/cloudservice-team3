using System.ComponentModel.DataAnnotations;

namespace CloudService.Application.Features.Auth.Models;

public sealed record UpdateProfileRequest(
    [Required(ErrorMessage = "Họ và tên không được để trống")]
    [MaxLength(100, ErrorMessage = "Họ và tên không được vượt quá 100 ký tự")]
    string FullName,

    [Required(ErrorMessage = "Email không được để trống")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    [MaxLength(255, ErrorMessage = "Email không được vượt quá 255 ký tự")]
    string Email
);
