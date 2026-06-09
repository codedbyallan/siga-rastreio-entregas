using MongoDB.Bson;
using MongoDB.Driver;
using SIGA.Order.Domain.Interfaces;
using OrderModel = SIGA.Order.Domain.Models.Order;

namespace SIGA.Order.Infra.Data.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly IMongoCollection<OrderModel> _collection;
    private const string CollectionName = "orders";

    public OrderRepository(IMongoDbFactory mongoDbFactory)
    {
        var database = mongoDbFactory.GetDatabase();
        _collection = database.GetCollection<OrderModel>(CollectionName);
    }

    public async Task<OrderModel?> GetByIdAsync(ObjectId id)
    {
        var filter = Builders<OrderModel>.Filter.Eq(order => order.Id, id);
        return await _collection.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<OrderModel>> GetAllAsync()
    {
        return await _collection.Find(_ => true).ToListAsync();
    }

    public async Task<IEnumerable<OrderModel>> GetByCompanyIdAsync(string companyId)
    {
        var filter = Builders<OrderModel>.Filter.Eq(order => order.CompanyId, companyId);
        return await _collection
            .Find(filter)
            .SortByDescending(order => order.CreatedAt)
            .ToListAsync();
    }

    public async Task<OrderModel> CreateAsync(OrderModel order)
    {
        order.Id = ObjectId.GenerateNewId();
        order.CreatedAt = DateTime.UtcNow;

        await _collection.InsertOneAsync(order);
        return order;
    }

    public async Task<OrderModel?> UpdateAsync(ObjectId id, OrderModel order)
    {
        var filter = Builders<OrderModel>.Filter.Eq(existingOrder => existingOrder.Id, id);
        var options = new FindOneAndReplaceOptions<OrderModel>
        {
            ReturnDocument = ReturnDocument.After
        };

        return await _collection.FindOneAndReplaceAsync(filter, order, options);
    }

    public async Task<bool> DeleteAsync(ObjectId id)
    {
        var filter = Builders<OrderModel>.Filter.Eq(order => order.Id, id);
        var result = await _collection.DeleteOneAsync(filter);

        return result.DeletedCount > 0;
    }
}