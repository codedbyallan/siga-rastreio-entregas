using MongoDB.Bson;
using MongoDB.Driver;
using SIGA.User.Domain.Interfaces;
using SIGA.User.Domain.Models;
using SIGA.User.Infra.Data.Factories;

namespace SIGA.User.Infra.Data.Repositories
{
    public class CompanyRepository : ICompanyRepository
    {
        private readonly IMongoCollection<Company> _collection;
        private const string CollectionName = "companies";

        public CompanyRepository(IMongoDbFactory mongoDbFactory)
        {
            var database = mongoDbFactory.GetDatabase();
            _collection = database.GetCollection<Company>(CollectionName);
        }

        public async Task<Company?> GetByIdAsync(ObjectId id)
        {
            var filter = Builders<Company>.Filter.Eq(c => c.Id, id);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<Company?> GetByCnpjAsync(string cnpj)
        {
            var filter = Builders<Company>.Filter.Eq(c => c.Cnpj, cnpj);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Company>> GetAllAsync()
        {
            return await _collection.Find(_ => true).ToListAsync();
        }

        public async Task<Company> CreateAsync(Company company)
        {
            company.Id = ObjectId.GenerateNewId();
            company.CreatedAt = DateTime.UtcNow;
            await _collection.InsertOneAsync(company);
            return company;
        }

        public async Task<Company?> UpdateAsync(ObjectId id, Company company)
        {
            var filter = Builders<Company>.Filter.Eq(c => c.Id, id);
            var options = new FindOneAndReplaceOptions<Company> { ReturnDocument = ReturnDocument.After };
            return await _collection.FindOneAndReplaceAsync(filter, company, options);
        }

        public async Task<bool> DeleteAsync(ObjectId id)
        {
            var filter = Builders<Company>.Filter.Eq(c => c.Id, id);
            var result = await _collection.DeleteOneAsync(filter);
            return result.DeletedCount > 0;
        }

        public async Task<bool> ExistsAsync(ObjectId id)
        {
            var filter = Builders<Company>.Filter.Eq(c => c.Id, id);
            var count = await _collection.CountDocumentsAsync(filter);
            return count > 0;
        }
    }
}   