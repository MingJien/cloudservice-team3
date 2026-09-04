using System.ComponentModel.DataAnnotations;
using CloudService.Domain.Common;
using CloudService.Domain.Enums;
using MediatR;

namespace CloudService.Application.Features.Orders.Commands;

public sealed class UpdateOrderStatusCommand : IRequest<Result>
{
    [Required] public long Id { get; init; }
    [Required] public OrderRequestStatus Status { get; init; }
    [StringLength(2000)] public string? InternalNote { get; init; }
    [Required, StringLength(64)] public string RowVersion { get; init; } = string.Empty;
    
    // Additional properties for audit logging
    public int UserId { get; init; }
    public string? IpAddress { get; init; }
}
