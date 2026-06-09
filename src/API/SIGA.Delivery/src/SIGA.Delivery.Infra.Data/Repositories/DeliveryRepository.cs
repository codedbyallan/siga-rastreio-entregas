using MongoDB.Bson;
using MongoDB.Driver;
using SIGA.Delivery.Domain.Interfaces;
using System.Text.RegularExpressions;
using DeliveryModel = SIGA.Delivery.Domain.Models.Delivery;

namespace SIGA.Delivery.Infra.Data.Repositories;

public class DeliveryRepository : IDeliveryRepository
{
    private readonly IMongoCollection<DeliveryModel> _collection;
    private const string CollectionName = "deliveries";

    public DeliveryRepository(IMongoDbFactory mongoDbFactory)
    {
        var database = mongoDbFactory.GetDatabase();
        _collection = database.GetCollection<DeliveryModel>(CollectionName);
    }

    public async Task<IEnumerable<DeliveryModel>> GetAllAsync()
    {
        return await _collection.Find(_ => true).ToListAsync();
    }

    public async Task<DeliveryModel> CreateAsync(DeliveryModel delivery)
    {
        await _collection.InsertOneAsync(delivery);
        return delivery;
    }

    public async Task<DeliveryModel?> GetByIdAsync(string id)
    {
        if (!ObjectId.TryParse(id, out var objectId))
        {
            return null;
        }

        var filter = Builders<DeliveryModel>.Filter.Eq(delivery => delivery.Id, objectId);
        return await _collection.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<DeliveryModel?> GetByTrackingCodeAsync(string trackingCode)
    {
        var normalizedTrackingCode = trackingCode.Trim();

        var filter = Builders<DeliveryModel>.Filter.Regex(
            delivery => delivery.TrackingCode,
            new BsonRegularExpression(
                $"^{Regex.Escape(normalizedTrackingCode)}$",
                "i"
            )
        );

        return await _collection.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<DeliveryModel?> GetByOrderIdAsync(string orderId)
    {
        var normalizedOrderId = orderId.Trim();

        var filter = Builders<DeliveryModel>.Filter.Eq(
            delivery => delivery.OrderId,
            normalizedOrderId
        );

        return await _collection.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<DeliveryModel>> GetByCourierIdAsync(string courierId)
    {
        var normalizedCourierId = courierId.Trim();

        var filter = Builders<DeliveryModel>.Filter.Eq(
            delivery => delivery.CourierId,
            normalizedCourierId
        );

        return await _collection.Find(filter).ToListAsync();
    }

    public async Task<bool> ExistsByTrackingCodeAsync(string trackingCode)
    {
        var normalizedTrackingCode = trackingCode.Trim();

        var filter = Builders<DeliveryModel>.Filter.Regex(
            delivery => delivery.TrackingCode,
            new BsonRegularExpression(
                $"^{Regex.Escape(normalizedTrackingCode)}$",
                "i"
            )
        );

        return await _collection.Find(filter).AnyAsync();
    }

    public async Task<bool> UpdateStatusAsync(string id, string status)
    {
        if (!ObjectId.TryParse(id, out var objectId))
        {
            return false;
        }

        var filter = Builders<DeliveryModel>.Filter.Eq(delivery => delivery.Id, objectId);

        var update = Builders<DeliveryModel>.Update.Set(
            delivery => delivery.Status,
            status
        );

        var result = await _collection.UpdateOneAsync(filter, update);

        return result.MatchedCount > 0;
    }

    public async Task<DeliveryModel?> AssignCourierAsync(string id, string courierId)
    {
        if (!ObjectId.TryParse(id, out var objectId))
        {
            return null;
        }

        var normalizedCourierId = courierId.Trim();

        var filter = Builders<DeliveryModel>.Filter.Eq(delivery => delivery.Id, objectId);

        var update = Builders<DeliveryModel>.Update.Set(
            delivery => delivery.CourierId,
            normalizedCourierId
        );

        var options = new FindOneAndUpdateOptions<DeliveryModel>
        {
            ReturnDocument = ReturnDocument.After
        };

        return await _collection.FindOneAndUpdateAsync(filter, update, options);
    }
}