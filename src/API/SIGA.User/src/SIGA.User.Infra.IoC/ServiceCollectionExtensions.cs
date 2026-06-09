using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SIGA.User.Application.Services;
using SIGA.User.Domain.Configurations;
using SIGA.User.Domain.Interfaces;
using SIGA.User.Domain.Interfaces.Services;
using SIGA.User.Infra.Data.Factories;
using SIGA.User.Infra.Data.Repositories;

namespace SIGA.User.Infra.IoC;

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
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ICompanyService, CompanyService>();
    }

    private static void RegisterRepositories(this IServiceCollection services)
    {
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ICompanyRepository, CompanyRepository>();
    }

    private static void RegisterOptions(this IServiceCollection services, IConfiguration configuration)
    {
        // Read from environment variables with fallback to configuration
        var settings = new MongoDbSettings
        {
            Host = Environment.GetEnvironmentVariable("MONGODB_HOST") ?? string.Empty,
            Username = Environment.GetEnvironmentVariable("MONGODB_USERNAME") ?? string.Empty,
            Password = Environment.GetEnvironmentVariable("MONGODB_PASSWORD") ?? string.Empty,
            DatabaseName = Environment.GetEnvironmentVariable("MONGODB_DATABASE_USER") ?? "user"
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
            DatabaseName = Environment.GetEnvironmentVariable("MONGODB_DATABASE_USER") ?? "user"
        };

        if (string.IsNullOrEmpty(mongoSettings.Host))
        {
            throw new InvalidOperationException("MONGODB_HOST environment variable is missing.");
        }

        var mongoFactory = new MongoDbFactory(Options.Create(mongoSettings));
        var database = mongoFactory.GetDatabase();

        // Ensure indexes are created
        var collections = database.ListCollectionNames().ToList();

        if (!collections.Contains("usuarios"))
        {
            database.CreateCollection("usuarios");
        }

        if (!collections.Contains("companies"))
        {
            database.CreateCollectionAsync("companies");
        }
    }
}
