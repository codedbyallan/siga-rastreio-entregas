using MongoDB.Driver;
using System;

namespace SIGA.Delivery.Domain.Interfaces;

public interface IMongoDbFactory
{
    IMongoDatabase GetDatabase();
}
