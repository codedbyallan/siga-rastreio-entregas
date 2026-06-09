using Microsoft.AspNetCore.Mvc;

namespace SIGA.Gateway.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SwaggerAggregatorController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<SwaggerAggregatorController> _logger;

    private readonly Dictionary<string, string> _services;

    public SwaggerAggregatorController(HttpClient httpClient, ILogger<SwaggerAggregatorController> logger, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;

        // Try to load services from configuration: SwaggerAggregator:Services
        try
        {
            var configServices = configuration.GetSection("SwaggerAggregator:Services").Get<Dictionary<string, string>>();
            if (configServices != null && configServices.Count > 0)
            {
                _services = configServices;
            }
            else
            {
                // Try to build services from ServiceUrls
                var serviceUrls = configuration.GetSection("ServiceUrls").Get<Dictionary<string, string>>();
                if (serviceUrls != null && serviceUrls.Count > 0)
                {
                    _services = new Dictionary<string, string>();
                    foreach (var kv in serviceUrls)
                    {
                        var displayName = kv.Key.Replace("Service", " API");
                        _services[displayName] = kv.Value;
                    }

                    // Ensure Gateway is included (default to localhost path base)
                    if (! _services.ContainsKey("Gateway"))
                    {
                        var gatewayFromConfig = configuration["SwaggerAggregator:Services:Gateway"] ?? configuration["Gateway:BaseUrl"];
                        _services["Gateway"] = gatewayFromConfig ?? "http://localhost:5000/api";
                    }
                }
                else
                {
                    _logger.LogInformation("Nenhum serviço em SwaggerAggregator:Services ou ServiceUrls — usando lista padrão.");
                    _services = new Dictionary<string, string>
                    {
                        { "User API", "http://siga-user-api:5001" },
                        { "Order API", "http://siga-order-api:5002" },
                        { "Delivery API", "http://siga-delivery-api:5003" },
                        { "Gateway", "http://localhost:5000/api" }
                    };
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao carregar serviços do SwaggerAggregator do configuration — usando lista padrão.");
            _services = new Dictionary<string, string>
            {
                { "User API", "http://siga-user-api:5001" },
                { "Order API", "http://siga-order-api:5002" },
                { "Delivery API", "http://siga-delivery-api:5003" },
                { "Gateway", "http://localhost:5000/api" }
            };
        }
    }

    [HttpGet("specs")]
    public async Task<IActionResult> GetAggregatedSpecs()
    {
        var specs = new Dictionary<string, object>();

        foreach (var (name, url) in _services)
        {
            try
            {
                var response = await _httpClient.GetAsync($"{url}/openapi/v1.json");
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    specs[name] = content;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao obter spec de {name}");
            }
        }

        return Ok(specs);
    }

    [HttpGet("services")]
    public IActionResult GetServices()
    {
        return Ok(_services.Select(s => new { name = s.Key, url = s.Value }).ToList());
    }
}
