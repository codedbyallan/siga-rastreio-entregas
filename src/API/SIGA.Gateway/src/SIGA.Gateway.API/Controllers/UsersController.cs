using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SIGA.Gateway.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IProxyService _proxyService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        IProxyService proxyService,
        IConfiguration configuration,
        ILogger<UsersController> logger)
    {
        _proxyService = proxyService;
        _configuration = configuration;
        _logger = logger;
    }

    [AllowAnonymous]
    [HttpPost("authenticate")]
    public async Task<IActionResult> Authenticate([FromBody] object credentials)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:UserService"];
            return await _proxyService.ForwardAsync(
                serviceUrl,
                "/api/users/authenticate",
                HttpMethod.Post,
                credentials);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao autenticar usuário");
            return StatusCode(500, new { error = "Erro ao autenticar usuário", message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:UserService"];
            return await _proxyService.ForwardAsync(serviceUrl, "/api/users", HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter usuários");
            return StatusCode(500, new { error = "Erro ao obter usuários", message = ex.Message });
        }
    }

    [HttpGet("couriers")]
    public async Task<IActionResult> GetCouriers()
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:UserService"];
            return await _proxyService.ForwardAsync(serviceUrl, "/api/users/couriers", HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter entregadores");
            return StatusCode(500, new { error = "Erro ao obter entregadores", message = ex.Message });
        }
    }

    [HttpGet("couriers/company/{companyId}")]
    public async Task<IActionResult> GetCouriersByCompanyId(string companyId)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:UserService"];
            return await _proxyService.ForwardAsync(
                serviceUrl,
                $"/api/users/couriers/company/{companyId}",
                HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter entregadores da empresa {CompanyId}", companyId);
            return StatusCode(500, new { error = "Erro ao obter entregadores da empresa", message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:UserService"];
            return await _proxyService.ForwardAsync(serviceUrl, $"/api/users/{id}", HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter usuário {Id}", id);
            return StatusCode(500, new { error = "Erro ao obter usuário", message = ex.Message });
        }
    }

    [HttpGet("email/{email}")]
    public async Task<IActionResult> GetByEmail(string email)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:UserService"];
            return await _proxyService.ForwardAsync(serviceUrl, $"/api/users/email/{email}", HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter usuário por email {Email}", email);
            return StatusCode(500, new { error = "Erro ao obter usuário", message = ex.Message });
        }
    }

    [HttpGet("internal/{id}")]
    public async Task<IActionResult> GetByIdInternal(string id)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:UserService"];
            return await _proxyService.ForwardAsync(serviceUrl, $"/api/users/internal/{id}", HttpMethod.Get);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter usuário interno {Id}", id);
            return StatusCode(500, new { error = "Erro ao obter usuário", message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] object user)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:UserService"];
            return await _proxyService.ForwardAsync(serviceUrl, "/api/users", HttpMethod.Post, user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar usuário");
            return StatusCode(500, new { error = "Erro ao criar usuário", message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] object user)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:UserService"];
            return await _proxyService.ForwardAsync(serviceUrl, $"/api/users/{id}", HttpMethod.Put, user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atualizar usuário {Id}", id);
            return StatusCode(500, new { error = "Erro ao atualizar usuário", message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        try
        {
            var serviceUrl = _configuration["ServiceUrls:UserService"];
            return await _proxyService.ForwardAsync(serviceUrl, $"/api/users/{id}", HttpMethod.Delete);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao deletar usuário {Id}", id);
            return StatusCode(500, new { error = "Erro ao deletar usuário", message = ex.Message });
        }
    }
}