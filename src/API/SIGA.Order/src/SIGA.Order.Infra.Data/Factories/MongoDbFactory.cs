using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SIGA.Order.Domain.Configurations;
using SIGA.Order.Domain.Interfaces;

namespace SIGA.Order.Infra.Data.Factories;

public class MongoDbFactory : IMongoDbFactory
{
    private readonly IMongoDatabase _database;

    public MongoDbFactory(IOptions<MongoDbSettings> settings)
    {
        var config = settings.Value;

        var mongoSettings = MongoClientSettings.FromConnectionString(config.Host);

        mongoSettings.Credential = MongoCredential.CreateCredential(
            "admin",
            config.Username,
            config.Password
        );

        var client = new MongoClient(mongoSettings);
        _database = client.GetDatabase(config.DatabaseName);
    }

    public IMongoDatabase GetDatabase() => _database;
}
