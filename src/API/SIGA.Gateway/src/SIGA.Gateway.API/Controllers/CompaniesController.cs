using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SIGA.Gateway.API.Controllers;

[ApiController]
[Route("api/companies")]
[Authorize]
public class CompaniesController : ControllerBase
{
    private readonly IProxyService _proxyService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CompaniesController> _logger;

    public CompaniesController(
        IProxyService proxyService,
        IConfiguration configuration,
        ILogger<CompaniesController> logger)
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
            var serviceUrl = _configuration["ServiceUrls:UserService"];
            return await _proxyService.ForwardAsync(serviceUrl, "/api/companies", HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter empresas");
            return StatusCode(500, new { error = "Erro ao obter empresas", message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:UserService"];
            return await _proxyService.ForwardAsync(serviceUrl, $"/api/companies/{id}", HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter empresa {Id}", id);
            return StatusCode(500, new { error = "Erro ao obter empresa", message = ex.Message });
        }
    }

    [HttpGet("cnpj/{cnpj}")]
    public async Task<IActionResult> GetByCnpj(string cnpj)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:UserService"];
            return await _proxyService.ForwardAsync(serviceUrl, $"/api/companies/cnpj/{cnpj}", HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter empresa pelo CNPJ {Cnpj}", cnpj);
            return StatusCode(500, new { error = "Erro ao obter empresa pelo CNPJ", message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] object company)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:UserService"];
            return await _proxyService.ForwardAsync(serviceUrl, "/api/companies", HttpMethod.Post, company);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar empresa");
            return StatusCode(500, new { error = "Erro ao criar empresa", message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] object company)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:UserService"];
            return await _proxyService.ForwardAsync(serviceUrl, $"/api/companies/{id}", HttpMethod.Put, company);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atualizar empresa {Id}", id);
            return StatusCode(500, new { error = "Erro ao atualizar empresa", message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:UserService"];
            return await _proxyService.ForwardAsync(serviceUrl, $"/api/companies/{id}", HttpMethod.Delete);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao deletar empresa {Id}", id);
            return StatusCode(500, new { error = "Erro ao deletar empresa", message = ex.Message });
        }
    }
}