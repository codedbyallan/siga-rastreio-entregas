using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SIGA.Gateway.API.Controllers;

[ApiController]
[Route("api/delivery-events")]
[Authorize]
public class DeliveryEventsController : ControllerBase
{
    private readonly IProxyService _proxyService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DeliveryEventsController> _logger;

    public DeliveryEventsController(
        IProxyService proxyService,
        IConfiguration configuration,
        ILogger<DeliveryEventsController> logger)
    {
        _proxyService = proxyService;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:DeliveryService"];
            return await _proxyService.ForwardAsync(serviceUrl, "/api/delivery-events", HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter eventos de entrega");
            return StatusCode(500, new { error = "Erro ao obter eventos de entrega", message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] object deliveryEvent)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:DeliveryService"];
            return await _proxyService.ForwardAsync(
                serviceUrl,
                "/api/delivery-events",
                HttpMethod.Post,
                deliveryEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar evento de entrega");
            return StatusCode(500, new { error = "Erro ao criar evento de entrega", message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:DeliveryService"];
            return await _proxyService.ForwardAsync(serviceUrl, $"/api/delivery-events/{id}", HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter evento de entrega {Id}", id);
            return StatusCode(500, new { error = "Erro ao obter evento de entrega", message = ex.Message });
        }
    }

    [HttpGet("delivery/{deliveryId}")]
    public async Task<IActionResult> GetByDeliveryId(string deliveryId)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:DeliveryService"];
            return await _proxyService.ForwardAsync(
                serviceUrl,
                $"/api/delivery-events/delivery/{deliveryId}",
                HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter eventos da entrega {DeliveryId}", deliveryId);
            return StatusCode(500, new { error = "Erro ao obter eventos da entrega", message = ex.Message });
        }
    }

    [HttpGet("order/{orderId}")]
    public async Task<IActionResult> GetByOrderId(string orderId)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:DeliveryService"];
            return await _proxyService.ForwardAsync(
                serviceUrl,
                $"/api/delivery-events/order/{orderId}",
                HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter histórico de entrega do pedido {OrderId}", orderId);
            return StatusCode(500, new { error = "Erro ao obter histórico de entrega", message = ex.Message });
        }
    }

    [HttpGet("latest/{deliveryId}")]
    public async Task<IActionResult> GetLatestStatus(string deliveryId)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:DeliveryService"];
            return await _proxyService.ForwardAsync(
                serviceUrl,
                $"/api/delivery-events/latest/{deliveryId}",
                HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter último status da entrega {DeliveryId}", deliveryId);
            return StatusCode(500, new { error = "Erro ao obter último status", message = ex.Message });
        }
    }
}