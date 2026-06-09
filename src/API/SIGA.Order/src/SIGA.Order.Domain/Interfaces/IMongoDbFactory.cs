using MongoDB.Driver;

namespace SIGA.Order.Domain.Interfaces;

public interface IMongoDbFactory
{
    IMongoDatabase GetDatabase();
}
