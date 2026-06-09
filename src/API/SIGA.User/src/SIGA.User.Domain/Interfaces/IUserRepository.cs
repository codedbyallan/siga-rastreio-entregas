using MongoDB.Bson;

namespace SIGA.User.Domain.Interfaces;

public interface IUserRepository
{
    Task<Domain.Models.User?> GetByIdAsync(ObjectId id);
    Task<Domain.Models.User?> GetByEmailAsync(string email);
    Task<IEnumerable<Domain.Models.User>> GetAllAsync();
    Task<IEnumerable<Domain.Models.User>> GetByRoleAsync(string role);
    Task<IEnumerable<Domain.Models.User>> GetByRoleAndCompanyIdAsync(string role, string companyId);
    Task<Domain.Models.User> CreateAsync(Domain.Models.User user);
    Task<Domain.Models.User?> UpdateAsync(ObjectId id, Domain.Models.User user);
    Task<bool> DeleteAsync(ObjectId id);
    Task<bool> ExistsAsync(ObjectId id);
}