using MongoDB.Bson;

namespace SIGA.Order.Domain.Interfaces;

public interface IOrderRepository
{
    Task<Models.Order?> GetByIdAsync(ObjectId id);
    Task<IEnumerable<Models.Order>> GetAllAsync();
    Task<IEnumerable<Models.Order>> GetByCompanyIdAsync(string companyId);
    Task<Models.Order> CreateAsync(Models.Order order);
    Task<Models.Order?> UpdateAsync(ObjectId id, Models.Order order);
    Task<bool> DeleteAsync(ObjectId id);
}