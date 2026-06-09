using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SIGA.Gateway.API.Controllers;

[ApiController]
[Route("api/deliveries")]
[Authorize]
public class DeliveriesController : ControllerBase
{
    private readonly IProxyService _proxyService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DeliveriesController> _logger;

    public DeliveriesController(
        IProxyService proxyService,
        IConfiguration configuration,
        ILogger<DeliveriesController> logger)
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
            return await _proxyService.ForwardAsync(serviceUrl, "/api/deliveries", HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter entregas");
            return StatusCode(500, new { error = "Erro ao obter entregas", message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpGet("tracking/{trackingCode}")]
    public async Task<IActionResult> GetByTrackingCode(string trackingCode)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:DeliveryService"];
            return await _proxyService.ForwardAsync(
                serviceUrl,
                $"/api/deliveries/tracking/{trackingCode}",
                HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter entrega pelo código de rastreio {TrackingCode}", trackingCode);
            return StatusCode(500, new { error = "Erro ao obter entrega pelo código de rastreio", message = ex.Message });
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
                $"/api/deliveries/order/{orderId}",
                HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter entrega do pedido {OrderId}", orderId);
            return StatusCode(500, new { error = "Erro ao obter entrega do pedido", message = ex.Message });
        }
    }

    [HttpGet("courier/{courierId}")]
    public async Task<IActionResult> GetByCourierId(string courierId)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:DeliveryService"];
            return await _proxyService.ForwardAsync(
                serviceUrl,
                $"/api/deliveries/courier/{courierId}",
                HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter entregas do entregador {CourierId}", courierId);
            return StatusCode(500, new { error = "Erro ao obter entregas do entregador", message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] object delivery)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:DeliveryService"];
            return await _proxyService.ForwardAsync(serviceUrl, "/api/deliveries", HttpMethod.Post, delivery);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar entrega");
            return StatusCode(500, new { error = "Erro ao criar entrega", message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:DeliveryService"];
            return await _proxyService.ForwardAsync(serviceUrl, $"/api/deliveries/{id}", HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter entrega {Id}", id);
            return StatusCode(500, new { error = "Erro ao obter entrega", message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] object delivery)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:DeliveryService"];
            return await _proxyService.ForwardAsync(serviceUrl, $"/api/deliveries/{id}", HttpMethod.Put, delivery);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atualizar entrega {Id}", id);
            return StatusCode(500, new { error = "Erro ao atualizar entrega", message = ex.Message });
        }
    }

    [HttpPatch("{deliveryId}/assign-courier")]
    public async Task<IActionResult> AssignCourier(string deliveryId, [FromBody] object dto)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:DeliveryService"];
            return await _proxyService.ForwardAsync(
                serviceUrl,
                $"/api/deliveries/{deliveryId}/assign-courier",
                HttpMethod.Patch,
                dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atribuir entregador à entrega {DeliveryId}", deliveryId);
            return StatusCode(500, new { error = "Erro ao atribuir entregador à entrega", message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:DeliveryService"];
            return await _proxyService.ForwardAsync(serviceUrl, $"/api/deliveries/{id}", HttpMethod.Delete);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao deletar entrega {Id}", id);
            return StatusCode(500, new { error = "Erro ao deletar entrega", message = ex.Message });
        }
    }
}