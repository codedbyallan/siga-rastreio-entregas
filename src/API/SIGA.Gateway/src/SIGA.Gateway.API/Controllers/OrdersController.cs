using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SIGA.Gateway.API.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IProxyService _proxyService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(
        IProxyService proxyService,
        IConfiguration configuration,
        ILogger<OrdersController> logger)
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
            var serviceUrl = _configuration["ServiceUrls:OrderService"];
            return await _proxyService.ForwardAsync(serviceUrl, "/api/orders", HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter pedidos");
            return StatusCode(500, new { error = "Erro ao obter pedidos", message = ex.Message });
        }
    }

    [HttpGet("company/{companyId}")]
    public async Task<IActionResult> GetByCompanyId(string companyId)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:OrderService"];
            return await _proxyService.ForwardAsync(
                serviceUrl,
                $"/api/orders/company/{companyId}",
                HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter pedidos da empresa {CompanyId}", companyId);
            return StatusCode(500, new { error = "Erro ao obter pedidos da empresa", message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:OrderService"];
            return await _proxyService.ForwardAsync(serviceUrl, $"/api/orders/{id}", HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter pedido {Id}", id);
            return StatusCode(500, new { error = "Erro ao obter pedido", message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] object order)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:OrderService"];
            return await _proxyService.ForwardAsync(serviceUrl, "/api/orders", HttpMethod.Post, order);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar pedido");
            return StatusCode(500, new { error = "Erro ao criar pedido", message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] object order)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:OrderService"];
            return await _proxyService.ForwardAsync(serviceUrl, $"/api/orders/{id}", HttpMethod.Put, order);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atualizar pedido {Id}", id);
            return StatusCode(500, new { error = "Erro ao atualizar pedido", message = ex.Message });
        }
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Patch(string id, [FromBody] object order)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:OrderService"];
            return await _proxyService.ForwardAsync(serviceUrl, $"/api/orders/{id}", HttpMethod.Patch, order);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atualizar parcialmente pedido {Id}", id);
            return StatusCode(500, new { error = "Erro ao atualizar pedido", message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:OrderService"];
            return await _proxyService.ForwardAsync(serviceUrl, $"/api/orders/{id}", HttpMethod.Delete);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao deletar pedido {Id}", id);
            return StatusCode(500, new { error = "Erro ao deletar pedido", message = ex.Message });
        }
    }
}