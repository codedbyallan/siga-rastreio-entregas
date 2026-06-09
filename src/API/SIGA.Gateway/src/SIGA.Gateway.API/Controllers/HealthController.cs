using Microsoft.AspNetCore.Mvc;

namespace SIGA.Gateway.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IProxyService _proxyService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<HealthController> _logger;

    private readonly Dictionary<string, string> _services = new()
    {
        { "UserService", "ServiceUrls:UserService" },
        { "OrderService", "ServiceUrls:OrderService" },
        { "DeliveryService", "ServiceUrls:DeliveryService" }
    };

    public HealthController(IProxyService proxyService, IConfiguration configuration, ILogger<HealthController> logger)
    {
        _proxyService = proxyService;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult> GetHealth()
    {
        var healthStatus = new
        {
            Status = "Gateway Operational",
            Timestamp = DateTime.UtcNow,
            Services = await CheckAllServices()
        };

        return Ok(healthStatus);
    }

    [HttpGet("{service}")]
    public async Task<ActionResult> GetServiceHealth(string service)
    {
        if (!_services.ContainsKey(service))
            return BadRequest(new { error = "Serviço não encontrado" });

        var serviceUrl = _configuration[_services[service]];
        var isHealthy = await CheckServiceHealth(serviceUrl);

        return Ok(new
        {
            Service = service,
            Status = isHealthy ? "Healthy" : "Unhealthy",
            Timestamp = DateTime.UtcNow
        });
    }

    private async Task<Dictionary<string, object>> CheckAllServices()
    {
        var results = new Dictionary<string, object>();

        foreach (var (serviceName, configKey) in _services)
        {
            try
            {
                var serviceUrl = _configuration[configKey];
                var isHealthy = await CheckServiceHealth(serviceUrl);

                results[serviceName] = new
                {
                    Status = isHealthy ? "Healthy" : "Unhealthy",
                    Timestamp = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Erro ao verificar saúde de {serviceName}: {ex.Message}");
                results[serviceName] = new
                {
                    Status = "Error",
                    Message = ex.Message,
                    Timestamp = DateTime.UtcNow
                };
            }
        }

        return results;
    }

    private async Task<bool> CheckServiceHealth(string serviceUrl)
    {
        try
        {
            var client = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
            var response = await client.GetAsync($"{serviceUrl}/health");
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogWarning($"Erro ao verificar saúde do serviço {serviceUrl}: {ex.Message}");
            return false;
        }
    }
}
