using MongoDB.Driver;
using SIGA.Delivery.Domain.Interfaces;
using SIGA.Delivery.Domain.Models;

namespace SIGA.Delivery.Infra.Data.Repositories
{
    public class DeliveryEventRepository : IDeliveryEventRepository
    {
        private readonly IMongoCollection<DeliveryEvent> _collection;

        public DeliveryEventRepository(IMongoDbFactory mongoDbFactory)
        {
            var database = mongoDbFactory.GetDatabase();
            _collection = database.GetCollection<DeliveryEvent>("delivery_events");
        }

        public async Task CreateAsync(DeliveryEvent deliveryEvent)
        {
            await _collection.InsertOneAsync(deliveryEvent);
        }

        public async Task<List<DeliveryEvent>> GetAllAsync()
        {
            return await _collection
                .Find(_ => true)
                .SortBy(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<DeliveryEvent>> GetByDeliveryIdAsync(string deliveryId)
        {
            return await _collection
                .Find(x => x.DeliveryId == deliveryId)
                .SortBy(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<DeliveryEvent?> GetByIdAsync(string id)
        {
            return await _collection
                .Find(x => x.Id == id)
                .FirstOrDefaultAsync();
        }

        public async Task<List<DeliveryEvent>> GetByOrderIdAsync(string orderId)
        {
            return await _collection
                .Find(x => x.OrderId == orderId)
                .SortBy(x => x.CreatedAt)
                .ToListAsync();
        }
    }
}