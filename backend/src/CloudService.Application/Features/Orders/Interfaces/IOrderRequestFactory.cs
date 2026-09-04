using CloudService.Application.Features.Orders.Models;
using CloudService.Application.Features.Pricing.Models;
using CloudService.Domain.Entities;

namespace CloudService.Application.Features.Orders.Interfaces;

public interface IOrderRequestFactory
{
    Task<OrderRequest> CreateAsync(
        CreateOrderRequest request,
        PricingQuoteResponse quote,
        CancellationToken cancellationToken);
}
