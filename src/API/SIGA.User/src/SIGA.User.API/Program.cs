using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using MongoDB.Driver;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using Scalar.AspNetCore;
using SIGA.User.Application.Services;
using SIGA.User.Domain.Configurations;
using SIGA.User.Domain.Constants;
using SIGA.User.Domain.Interfaces;
using SIGA.User.Domain.Interfaces.Services;
using SIGA.User.Domain.Models;
using SIGA.User.Infra.Data.Factories;
using SIGA.User.Infra.Data.Repositories;
using SIGA.User.Infra.IoC;
using SIGA.User.Api.Handlers;
using SIGA.User.Api.Helpers;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using SIGA.User.Domain.Responses;
using Microsoft.AspNetCore.Mvc;

// DEBUG: Print environment variables
Console.WriteLine("=== SIGA.User API Starting ===");
Console.WriteLine($"DOTNET_RUNNING_IN_CONTAINER: {Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER")}");
Console.WriteLine($"MONGODB_HOST: {Environment.GetEnvironmentVariable("MONGODB_HOST")}");
Console.WriteLine($"MONGODB_USERNAME: {Environment.GetEnvironmentVariable("MONGODB_USERNAME")}");
Console.WriteLine($"MONGODB_PASSWORD: {Environment.GetEnvironmentVariable("MONGODB_PASSWORD")}");
Console.WriteLine($"MONGODB_DATABASE_USER: {Environment.GetEnvironmentVariable("MONGODB_DATABASE_USER")}");

// Load .env file only for local development (not in Docker)
if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER")))
{
    Console.WriteLine("Running in container - skipping .env file loading");
}
else
{
    Console.WriteLine("Running locally - attempting to load .env file");
    var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env");

    if (File.Exists(envPath))
    {
        Console.WriteLine($"Loading .env from: {envPath}");

        foreach (var line in File.ReadAllLines(envPath))
        {
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#")) continue;

            var parts = line.Split('=', 2);

            if (parts.Length == 2)
            {
                Environment.SetEnvironmentVariable(parts[0].Trim(), parts[1].Trim());
            }
        }
    }
    else
    {
        Console.WriteLine($".env file not found at: {envPath}");
    }
}

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.RegisterApplicationServices(builder.Configuration, args);

// Configurar MongoDbSettings via variáveis de ambiente
var mongoDbSettings = new MongoDbSettings
{
    Host = Environment.GetEnvironmentVariable("MONGODB_HOST") ?? string.Empty,
    Username = Environment.GetEnvironmentVariable("MONGODB_USERNAME") ?? string.Empty,
    Password = Environment.GetEnvironmentVariable("MONGODB_PASSWORD") ?? string.Empty,
    DatabaseName = Environment.GetEnvironmentVariable("MONGODB_DATABASE_USER") ?? "user"
};

builder.Services.Configure<MongoDbSettings>(options =>
{
    options.Host = mongoDbSettings.Host;
    options.Username = mongoDbSettings.Username;
    options.Password = mongoDbSettings.Password;
    options.DatabaseName = mongoDbSettings.DatabaseName;
});

// Registrar MongoDbFactory como singleton
builder.Services.AddSingleton<IMongoDbFactory, MongoDbFactory>();

// Registrar a coleção Companies via factory
builder.Services.AddSingleton(sp =>
{
    var factory = sp.GetRequiredService<IMongoDbFactory>();
    return factory.GetDatabase().GetCollection<Company>("Companies");
});

// Registrar repositório e serviço
builder.Services.AddScoped<ICompanyRepository, CompanyRepository>();
builder.Services.AddScoped<ICompanyService, CompanyService>();

// Controllers + NewtonsoftJson
builder.Services.AddControllers(options =>
{
    options.Conventions.Add(new RouteTokenTransformerConvention(new SlugifyParameterTransformer()));
})
.AddNewtonsoftJson(o =>
{
    o.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
    o.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
    o.SerializerSettings.ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
})
.ConfigureApiBehaviorOptions(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => new ErrorResponse(e.ErrorMessage))
            .ToList();

        var result = new DataResponse<object>(null, false, errors);
        return new BadRequestObjectResult(result);
    };
});

const string JwtSecretKey = "yDy4b6QVP3lVDeG0oDlBG4eQEMmODLqg";

JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false;
    options.MapInboundClaims = false;

    options.UseSecurityTokenValidators = true;
    options.SecurityTokenValidators.Clear();
    options.SecurityTokenValidators.Add(new JwtSecurityTokenHandler());

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateIssuerSigningKey = true,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(5),
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(JwtSecretKey)
        ),
        NameClaimType = "nameid",
        RoleClaimType = "role"
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var authHeader = context.Request.Headers.Authorization.ToString();

            if (!string.IsNullOrWhiteSpace(authHeader) &&
                authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                var extractedToken = authHeader["Bearer ".Length..]
                    .Trim()
                    .Trim('"')
                    .Trim('\'');

                extractedToken = new string(
                    extractedToken
                        .Where(character => !char.IsWhiteSpace(character))
                        .ToArray()
                );

                if (!string.IsNullOrWhiteSpace(extractedToken) &&
                    !string.Equals(extractedToken, "null", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(extractedToken, "undefined", StringComparison.OrdinalIgnoreCase))
                {
                    context.Token = extractedToken;
                }
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

// Scalar + API Explorer
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Usar forwarded headers
app.UseForwardedHeaders();

// Scalar/OpenAPI
if (!app.Environment.IsProduction())
{
    app.MapOpenApi();
    app.UsePathBase(OpenApiServerConstants.Url);
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("SIGA Companies API")
               .WithTheme(ScalarTheme.BluePlanet)
               .WithLayout(ScalarLayout.Classic);
    });
}

app.UseMiddleware<ExceptionHandler>();
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

// Mapear controllers
app.MapControllers();

await app.RunAsync();