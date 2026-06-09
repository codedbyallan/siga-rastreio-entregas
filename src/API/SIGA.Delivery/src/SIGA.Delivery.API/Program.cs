using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using Scalar.AspNetCore;
using SIGA.Delivery.Domain.Constants;
using SIGA.Delivery.Domain.Responses;
using SIGA.Delivery.Infra.IoC;
using SIGA.Delivery.Api.Handlers;
using SIGA.Delivery.Api.Helpers;
using Refit;
using SIGA.Delivery.Application.Clients;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

// DEBUG: Print environment variables
Console.WriteLine("=== SIGA.Delivery API Starting ===");
Console.WriteLine($"MONGODB_HOST: {Environment.GetEnvironmentVariable("MONGODB_HOST")}");
Console.WriteLine($"MONGODB_DATABASE_DELIVERY: {Environment.GetEnvironmentVariable("MONGODB_DATABASE_DELIVERY")}");

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
}

var builder = WebApplication.CreateBuilder(args);

const string FrontendCorsPolicy = "FrontendCorsPolicy";
const string JwtSecretKey = "yDy4b6QVP3lVDeG0oDlBG4eQEMmODLqg";

var isRunningInContainer = !string.IsNullOrEmpty(
    Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER")
);

var defaultOrderApiUrl = isRunningInContainer
    ? "http://siga-order:5002"
    : "http://localhost:5002";

var defaultUserApiUrl = isRunningInContainer
    ? "http://siga-user:5001"
    : "http://localhost:5001";

var orderApiBaseUrl =
    builder.Configuration["ORDER_API_BASE_URL"] ??
    Environment.GetEnvironmentVariable("ORDER_API_BASE_URL") ??
    defaultOrderApiUrl;

var userApiBaseUrl =
    builder.Configuration["USER_API_BASE_URL"] ??
    Environment.GetEnvironmentVariable("USER_API_BASE_URL") ??
    defaultUserApiUrl;

Console.WriteLine($"ORDER_API_BASE_URL: {orderApiBaseUrl}");
Console.WriteLine($"USER_API_BASE_URL: {userApiBaseUrl}");

builder.Services.RegisterApplicationServices(builder.Configuration, args);

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "https://localhost:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

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

builder.Services.AddRefitClient<IOrderApiClient>()
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(orderApiBaseUrl));

builder.Services.AddRefitClient<IUserApiClient>()
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(userApiBaseUrl));

builder.Services.AddControllers(options =>
{
    options.Conventions.Add(new RouteTokenTransformerConvention(new SlugifyParameterTransformer()));
})
.AddNewtonsoftJson(o =>
{
    o.SerializerSettings.NullValueHandling = NullValueHandling.Ignore;
    o.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
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

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedProto;

    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseForwardedHeaders();

if (!app.Environment.IsProduction())
{
    app.MapOpenApi();
    app.UsePathBase(OpenApiServerConstants.Url);
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("SIGA Delivery API")
               .WithTheme(ScalarTheme.BluePlanet)
               .WithLayout(ScalarLayout.Classic);
    });
}

app.UseMiddleware<ExceptionHandler>();

app.UseCors(FrontendCorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

await app.RunAsync();