using SIGA.Order.Domain.DTOs;

namespace SIGA.Order.Domain.Interfaces.Services;

public interface IOrderService
{
    Task<OrderDto?> GetByIdAsync(string id);
    Task<IEnumerable<OrderDto>> GetAllAsync();
    Task<IEnumerable<OrderDto>> GetByCompanyIdAsync(string companyId);
    Task<OrderDto> CreateAsync(CreateOrderDto dto);
    Task<OrderDto?> UpdateAsync(string id, UpdateOrderDto dto);
    Task<bool> DeleteAsync(string id);
}