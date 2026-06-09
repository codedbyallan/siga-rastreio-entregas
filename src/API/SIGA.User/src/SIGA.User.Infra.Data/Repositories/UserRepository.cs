using MongoDB.Bson;
using MongoDB.Driver;
using SIGA.User.Domain.Interfaces;
using SIGA.User.Infra.Data.Factories;

namespace SIGA.User.Infra.Data.Repositories;

public class UserRepository : IUserRepository
{
    private readonly IMongoCollection<Domain.Models.User> _collection;
    private const string CollectionName = "users";

    public UserRepository(IMongoDbFactory mongoDbFactory)
    {
        var database = mongoDbFactory.GetDatabase();
        _collection = database.GetCollection<Domain.Models.User>(CollectionName);
    }

    public async Task<Domain.Models.User?> GetByIdAsync(ObjectId id)
    {
        var filter = Builders<Domain.Models.User>.Filter.Eq(u => u.Id, id);
        return await _collection.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<Domain.Models.User?> GetByEmailAsync(string email)
    {
        var filter = Builders<Domain.Models.User>.Filter.Eq(u => u.Email, email);
        return await _collection.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<Domain.Models.User>> GetAllAsync()
    {
        return await _collection.Find(_ => true).ToListAsync();
    }

    public async Task<IEnumerable<Domain.Models.User>> GetByRoleAsync(string role)
    {
        var normalizedRole = role.Trim().ToLowerInvariant();
        var filter = Builders<Domain.Models.User>.Filter.Eq(u => u.Role, normalizedRole);

        return await _collection.Find(filter).ToListAsync();
    }

    public async Task<IEnumerable<Domain.Models.User>> GetByRoleAndCompanyIdAsync(string role, string companyId)
    {
        var normalizedRole = role.Trim().ToLowerInvariant();
        var normalizedCompanyId = companyId.Trim();

        var filter = Builders<Domain.Models.User>.Filter.And(
            Builders<Domain.Models.User>.Filter.Eq(u => u.Role, normalizedRole),
            Builders<Domain.Models.User>.Filter.Eq(u => u.CompanyId, normalizedCompanyId)
        );

        return await _collection.Find(filter).ToListAsync();
    }

    public async Task<Domain.Models.User> CreateAsync(Domain.Models.User user)
    {
        if (user.Id == ObjectId.Empty)
            user.Id = ObjectId.GenerateNewId();

        if (user.CreatedAt == default)
            user.CreatedAt = DateTime.UtcNow;

        await _collection.InsertOneAsync(user);
        return user;
    }

    public async Task<Domain.Models.User?> UpdateAsync(ObjectId id, Domain.Models.User user)
    {
        if (user.UpdatedAt == null || user.UpdatedAt == default)
            user.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Domain.Models.User>.Filter.Eq(u => u.Id, id);
        var options = new FindOneAndReplaceOptions<Domain.Models.User>
        {
            ReturnDocument = ReturnDocument.After
        };

        return await _collection.FindOneAndReplaceAsync(filter, user, options);
    }

    public async Task<bool> DeleteAsync(ObjectId id)
    {
        var filter = Builders<Domain.Models.User>.Filter.Eq(u => u.Id, id);
        var result = await _collection.DeleteOneAsync(filter);

        return result.DeletedCount > 0;
    }

    public async Task<bool> ExistsAsync(ObjectId id)
    {
        var filter = Builders<Domain.Models.User>.Filter.Eq(u => u.Id, id);
        var count = await _collection.CountDocumentsAsync(filter);

        return count > 0;
    }
}