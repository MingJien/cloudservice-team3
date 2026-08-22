using System.ComponentModel.DataAnnotations;

namespace CloudService.Application.Common.Models;

public sealed class PagedRequest
{
    [Range(1, int.MaxValue)]
    public int PageNumber { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 20;
}
