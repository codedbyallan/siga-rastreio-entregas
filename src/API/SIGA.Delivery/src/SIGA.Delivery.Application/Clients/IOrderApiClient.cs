using Refit;
using SIGA.Delivery.Domain.DTOs;

namespace SIGA.Delivery.Application.Clients;

public interface IOrderApiClient
{
    [Get("/api/orders/{id}")]
    [Headers("X-Internal-Api-Key: siga-internal-api-key")]
    Task<ApiDataResponseDto<Domain.Models.Order>> GetOrderByIdAsync(string id);

    [Patch("/api/orders/{id}")]
    [Headers("X-Internal-Api-Key: siga-internal-api-key")]
    Task UpdateOrderStatusAsync(string id, [Body] UpdateOrderDto statusUpdate);
}