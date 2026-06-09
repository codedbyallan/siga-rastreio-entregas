using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SIGA.Order.Application.Services;
using SIGA.Order.Domain.Configurations;
using SIGA.Order.Domain.Interfaces;
using SIGA.Order.Domain.Interfaces.Services;
using SIGA.Order.Infra.Data.Factories;
using SIGA.Order.Infra.Data.Repositories;

namespace SIGA.Order.Infra.IoC;

public static class ServiceCollectionExtensions
{
    public static void RegisterApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.RegisterOptions(configuration);
        services.RegisterDatabase(configuration);
        services.MongoDbInitialize(configuration);
        services.RegisterRepositories();
        services.RegisterServices();
    }

    private static void RegisterServices(this IServiceCollection services)
    {
        services.AddScoped<IOrderService, OrderService>();
    }

    private static void RegisterRepositories(this IServiceCollection services)
    {
        services.AddScoped<IOrderRepository, OrderRepository>();
    }

    private static void RegisterOptions(this IServiceCollection services, IConfiguration configuration)
    {
        // Read from environment variables with fallback to configuration
        var settings = new MongoDbSettings
        {
            Host = Environment.GetEnvironmentVariable("MONGODB_HOST") ?? string.Empty,
            Username = Environment.GetEnvironmentVariable("MONGODB_USERNAME") ?? string.Empty,
            Password = Environment.GetEnvironmentVariable("MONGODB_PASSWORD") ?? string.Empty,
            DatabaseName = Environment.GetEnvironmentVariable("MONGODB_DATABASE_ORDER") ?? "order"
        };

        services.Configure<MongoDbSettings>(options =>
        {
            options.Host = settings.Host;
            options.Username = settings.Username;
            options.Password = settings.Password;
            options.DatabaseName = settings.DatabaseName;
        });
    }

    public static void RegisterDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<IMongoDbFactory, MongoDbFactory>();
    }

    public static void MongoDbInitialize(this IServiceCollection services, IConfiguration configuration)
    {
        var mongoSettings = new MongoDbSettings
        {
            Host = Environment.GetEnvironmentVariable("MONGODB_HOST") ?? string.Empty,
            Username = Environment.GetEnvironmentVariable("MONGODB_USERNAME") ?? string.Empty,
            Password = Environment.GetEnvironmentVariable("MONGODB_PASSWORD") ?? string.Empty,
            DatabaseName = Environment.GetEnvironmentVariable("MONGODB_DATABASE_ORDER") ?? "order"
        };

        if (string.IsNullOrEmpty(mongoSettings.Host))
        {
            throw new InvalidOperationException("MONGODB_HOST environment variable is missing.");
        }

        var mongoFactory = new MongoDbFactory(Options.Create(mongoSettings));
        var database = mongoFactory.GetDatabase();

        var collectionCursor = database.ListCollectionNames();
        var collections = new List<string>();
        while (collectionCursor.MoveNext())
        {
            collections.AddRange(collectionCursor.Current);
        }

        if (!collections.Contains("orders"))
        {
            database.CreateCollection("orders");
        }
    }
}

