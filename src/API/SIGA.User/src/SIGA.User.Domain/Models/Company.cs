using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SIGA.User.Domain.Models
{
    [BsonIgnoreExtraElements]
    public class Company
    {
        public ObjectId Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Cnpj { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public Address Address { get; set; } = new Address();
        public DateTime CreatedAt { get; set; }
    }
}