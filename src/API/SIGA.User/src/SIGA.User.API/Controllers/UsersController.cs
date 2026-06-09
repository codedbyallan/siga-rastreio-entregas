using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using SIGA.User.Domain.DTOs;
using SIGA.User.Domain.Interfaces.Services;
using SIGA.User.Domain.Models;
using SIGA.User.Domain.Responses;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SIGA.User.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [Authorize]
    [HttpGet]
    [ProducesResponseType(typeof(DataResponse<IEnumerable<UserDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        if (!IsAdmin())
        {
            return Forbid();
        }

        var users = await _userService.GetAllAsync();
        return Ok(new DataResponse<IEnumerable<UserDto>>(users, true));
    }

    [Authorize]
    [HttpGet("couriers")]
    [ProducesResponseType(typeof(DataResponse<IEnumerable<UserDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCouriers()
    {
        if (IsAdmin())
        {
            var allCouriers = await _userService.GetCouriersAsync();
            return Ok(new DataResponse<IEnumerable<UserDto>>(allCouriers, true));
        }

        if (IsCompanyOperator())
        {
            var companyId = GetCurrentCompanyId();

            if (string.IsNullOrWhiteSpace(companyId))
            {
                return Forbid();
            }

            var companyCouriers = await _userService.GetCouriersByCompanyIdAsync(companyId);
            return Ok(new DataResponse<IEnumerable<UserDto>>(companyCouriers, true));
        }

        return Forbid();
    }

    [Authorize]
    [HttpGet("couriers/company/{companyId}")]
    [ProducesResponseType(typeof(DataResponse<IEnumerable<UserDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCouriersByCompanyId(string companyId)
    {
        if (!IsAdmin() && !IsSameCompany(companyId))
        {
            return Forbid();
        }

        var couriers = await _userService.GetCouriersByCompanyIdAsync(companyId);
        return Ok(new DataResponse<IEnumerable<UserDto>>(couriers, true));
    }

    [Authorize]
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(DataResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(string id)
    {
        if (!IsAdmin() && GetCurrentUserId() != id)
        {
            return Forbid();
        }

        var user = await _userService.GetByIdAsync(id);

        if (user == null)
        {
            return UserNotFound();
        }

        return Ok(new DataResponse<UserDto>(user, true));
    }

    [AllowAnonymous]
    [HttpGet("internal/{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByIdInternal(string id)
    {
        if (!IsInternalRequest())
        {
            return Unauthorized(new
            {
                message = "Chamada interna não autorizada."
            });
        }

        var user = await _userService.GetByIdAsync(id);

        if (user == null)
        {
            return UserNotFound();
        }

        return Ok(new
        {
            id = user.Id,
            name = user.Name,
            email = user.Email,
            phone = user.Phone,
            role = user.Role,
            companyId = user.CompanyId,
            address = user.Address
        });
    }

    [Authorize]
    [HttpGet("email/{email}")]
    [ProducesResponseType(typeof(DataResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByEmail(string email)
    {
        if (!IsAdmin())
        {
            return Forbid();
        }

        var user = await _userService.GetByEmailAsync(email);

        if (user == null)
        {
            return UserNotFound();
        }

        return Ok(new DataResponse<UserDto>(user, true));
    }

    [AllowAnonymous]
    [HttpPost]
    [ProducesResponseType(typeof(DataResponse<UserDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        try
        {
            var requestedRole = NormalizeRole(dto?.Role);

            if (requestedRole == "admin" && !IsAdmin())
            {
                if (User?.Identity?.IsAuthenticated == true)
                {
                    return Forbid();
                }

                return Unauthorized(new { message = "Apenas administradores podem criar usuários administrativos." });
            }

            if (requestedRole == "courier")
            {
                var authorizationResult = PrepareCourierCreation(dto);

                if (authorizationResult != null)
                {
                    return authorizationResult;
                }
            }

            var user = await _userService.CreateAsync(dto);

            return CreatedAtAction(
                nameof(GetById),
                new { id = user.Id },
                new DataResponse<UserDto>(user, true)
            );
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new DataResponse(false, new List<ErrorResponse>
            {
                new(ex.Message)
            }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new DataResponse(false, new List<ErrorResponse>
            {
                new(ex.Message)
            }));
        }
    }

    [Authorize]
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(DataResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateUserDto dto)
    {
        try
        {
            var isOwnUser = GetCurrentUserId() == id;

            if (!IsAdmin() && !isOwnUser)
            {
                return Forbid();
            }

            if (!IsAdmin() && dto != null && (!string.IsNullOrWhiteSpace(dto.Role) || dto.CompanyId != null))
            {
                return Forbid();
            }

            var user = await _userService.UpdateAsync(id, dto);

            if (user == null)
            {
                return UserNotFound();
            }

            return Ok(new DataResponse<UserDto>(user, true));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new DataResponse(false, new List<ErrorResponse>
            {
                new(ex.Message)
            }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new DataResponse(false, new List<ErrorResponse>
            {
                new(ex.Message)
            }));
        }
    }

    [Authorize]
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        if (!IsAdmin())
        {
            return Forbid();
        }

        var success = await _userService.DeleteAsync(id);

        if (!success)
        {
            return UserNotFound();
        }

        return Ok(new DataResponse(true));
    }

    [AllowAnonymous]
    [HttpPost("authenticate")]
    public async Task<IActionResult> Authenticate([FromBody] AuthenticateDto model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Email) || string.IsNullOrWhiteSpace(model.Password))
        {
            return Unauthorized(new { message = "E-mail ou senha inválidos." });
        }

        var user = await _userService.GetByEmailAsync(model.Email);

        if (user == null)
        {
            return Unauthorized(new { message = "E-mail ou senha inválidos." });
        }

        var senhaValida = BCrypt.Net.BCrypt.Verify(model.Password, user.Password);

        if (!senhaValida)
        {
            return Unauthorized(new { message = "E-mail ou senha inválidos." });
        }

        var token = GenerateJwtToken(user);

        return Ok(new
        {
            token,
            user = new
            {
                id = user.Id,
                name = user.Name,
                email = user.Email,
                phone = user.Phone,
                role = user.Role,
                companyId = user.CompanyId,
                address = user.Address
            }
        });
    }

    private IActionResult? PrepareCourierCreation(CreateUserDto? dto)
    {
        if (dto == null)
        {
            return BadRequest(new DataResponse(false, new List<ErrorResponse>
            {
                new("Dados do usuário são obrigatórios.")
            }));
        }

        if (IsAdmin())
        {
            return null;
        }

        if (!IsCompanyOperator())
        {
            if (User?.Identity?.IsAuthenticated == true)
            {
                return Forbid();
            }

            return Unauthorized(new { message = "Apenas administradores ou operadores da empresa podem criar entregadores." });
        }

        var currentCompanyId = GetCurrentCompanyId();

        if (string.IsNullOrWhiteSpace(currentCompanyId))
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(dto.CompanyId))
        {
            dto.CompanyId = currentCompanyId;
            return null;
        }

        if (!string.Equals(dto.CompanyId, currentCompanyId, StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        return null;
    }

    private bool IsInternalRequest()
    {
        const string InternalApiKey = "siga-internal-api-key";

        if (!Request.Headers.TryGetValue("X-Internal-Api-Key", out var apiKey))
        {
            return false;
        }

        return string.Equals(
            apiKey.ToString(),
            InternalApiKey,
            StringComparison.Ordinal
        );
    }

    private string GenerateJwtToken(UserDto user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes("yDy4b6QVP3lVDeG0oDlBG4eQEMmODLqg");

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Role, user.Role)
        };

        if (!string.IsNullOrWhiteSpace(user.CompanyId))
        {
            claims.Add(new Claim("companyId", user.CompanyId));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(8),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature
            )
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("nameid")?.Value
            ?? User.FindFirst("sub")?.Value;
    }

    private string? GetCurrentCompanyId()
    {
        return User.FindFirst("companyId")?.Value
            ?? User.FindFirst("companyid")?.Value
            ?? User.FindFirst("company_id")?.Value;
    }

    private string GetCurrentRole()
    {
        return (
            User.FindFirst(ClaimTypes.Role)?.Value
            ?? User.FindFirst("role")?.Value
            ?? string.Empty
        ).Trim().ToLowerInvariant();
    }

    private bool IsAdmin()
    {
        return GetCurrentRole() == "admin";
    }

    private bool IsCompanyOperator()
    {
        return GetCurrentRole() == "company_operator";
    }

    private bool IsSameCompany(string? companyId)
    {
        var currentCompanyId = GetCurrentCompanyId();

        return !string.IsNullOrWhiteSpace(currentCompanyId) &&
               !string.IsNullOrWhiteSpace(companyId) &&
               string.Equals(currentCompanyId, companyId, StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeRole(string? role)
    {
        if (string.IsNullOrWhiteSpace(role))
        {
            return "company_operator";
        }

        var normalizedRole = role.Trim().ToLowerInvariant();

        return normalizedRole switch
        {
            "client" => "company_operator",
            "customer" => "company_operator",
            "operator" => "company_operator",
            "companyoperator" => "company_operator",
            "company_operator" => "company_operator",
            "admin" => "admin",
            "courier" => "courier",
            "entregador" => "courier",
            _ => normalizedRole
        };
    }

    private NotFoundObjectResult UserNotFound()
    {
        return NotFound(new DataResponse(false, new List<ErrorResponse>
        {
            new("User not found")
        }));
    }
}