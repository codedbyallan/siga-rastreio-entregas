using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SIGA.Delivery.Application.Interfaces;
using SIGA.Delivery.Application.Services;
using SIGA.Delivery.Domain.Configurations;
using SIGA.Delivery.Domain.Interfaces;
using SIGA.Delivery.Domain.Interfaces.Services;
using SIGA.Delivery.Infra.Data.Factories;
using SIGA.Delivery.Infra.Data.Repositories;
using System;
using System.Collections.Generic;

namespace SIGA.Delivery.Infra.IoC;

public static class ServiceCollectionExtensions
{
    public static void RegisterApplicationServices(this IServiceCollection services, IConfiguration configuration, string[] args)
    {
        services.RegisterOptions(configuration);
        services.RegisterDatabase(configuration);
        services.MongoDbInitialize(configuration);
        services.RegisterRepositories();
        services.RegisterServices();
    }

    private static void RegisterServices(this IServiceCollection services)
    {
        services.AddScoped<IDeliveryService, DeliveryService>();
        services.AddScoped<IDeliveryEventService, DeliveryEventService>();
    }

    private static void RegisterRepositories(this IServiceCollection services)
    {
        services.AddScoped<IDeliveryRepository, DeliveryRepository>();
        services.AddScoped<IDeliveryEventRepository, DeliveryEventRepository>();
    }

    private static void RegisterOptions(this IServiceCollection services, IConfiguration configuration)
    {
        // Read from environment variables with fallback to configuration
        var settings = new MongoDbSettings
        {
            Host = Environment.GetEnvironmentVariable("MONGODB_HOST") ?? string.Empty,
            Username = Environment.GetEnvironmentVariable("MONGODB_USERNAME") ?? string.Empty,
            Password = Environment.GetEnvironmentVariable("MONGODB_PASSWORD") ?? string.Empty,
            DatabaseName = Environment.GetEnvironmentVariable("MONGODB_DATABASE_DELIVERY") ?? "delivery"
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
            DatabaseName = Environment.GetEnvironmentVariable("MONGODB_DATABASE_DELIVERY") ?? "delivery"
        };

        if (string.IsNullOrEmpty(mongoSettings.Host))
        {
            throw new InvalidOperationException("MONGODB_HOST environment variable is missing.");
        }

        var mongoFactory = new MongoDbFactory(Options.Create(mongoSettings));
        var database = mongoFactory.GetDatabase();

        var collectionCursor = database.ListCollectionNames();
        var collections = collectionCursor.ToList();

        if (!collections.Contains("deliveries"))
        {
            database.CreateCollection("deliveries");
        }
    }
}