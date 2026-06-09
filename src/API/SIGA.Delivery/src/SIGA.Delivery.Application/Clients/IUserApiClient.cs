using Refit;
using SIGA.Delivery.Domain.DTOs;

namespace SIGA.Delivery.Application.Clients;

public interface IUserApiClient
{
    [Get("/api/users/internal/{id}")]
    [Headers("X-Internal-Api-Key: siga-internal-api-key")]
    Task<UserClientDto> GetUserByIdAsync(string id);
}