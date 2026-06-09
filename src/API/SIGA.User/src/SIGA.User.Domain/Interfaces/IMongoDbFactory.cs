using MongoDB.Driver;

namespace SIGA.User.Domain.Interfaces;

public interface IMongoDbFactory
{
    IMongoDatabase GetDatabase();
}