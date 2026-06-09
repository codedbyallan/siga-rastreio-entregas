using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SIGA.Delivery.Domain.Models
{
    [BsonIgnoreExtraElements]
    public class DeliveryEvent
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string DeliveryId { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public string EventType { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public Actor Actor { get; set; } = new Actor();
    }
}