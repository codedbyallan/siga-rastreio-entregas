using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGA.Order.Domain.DTOs;
using SIGA.Order.Domain.Interfaces.Services;
using SIGA.Order.Domain.Responses;
using System.Security.Claims;

namespace SIGA.Order.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private const string InternalApiKeyHeaderName = "X-Internal-Api-Key";
    private const string DefaultInternalApiKey = "siga-internal-api-key";

    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [Authorize]
    [HttpGet]
    [ProducesResponseType(typeof(DataResponse<IEnumerable<OrderDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        if (!IsAdmin())
        {
            return Forbid();
        }

        var orders = await _orderService.GetAllAsync();
        return Ok(new DataResponse<IEnumerable<OrderDto>>(orders, true));
    }

    [Authorize]
    [HttpGet("company/{companyId}")]
    [ProducesResponseType(typeof(DataResponse<IEnumerable<OrderDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByCompanyId(string companyId)
    {
        if (!IsAdmin() && !IsSameCompany(companyId))
        {
            return Forbid();
        }

        var orders = await _orderService.GetByCompanyIdAsync(companyId);
        return Ok(new DataResponse<IEnumerable<OrderDto>>(orders, true));
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(DataResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(string id)
    {
        var order = await _orderService.GetByIdAsync(id);

        if (order == null)
        {
            return OrderNotFound();
        }

        if (IsInternalRequest())
        {
            return Ok(new DataResponse<OrderDto>(order, true));
        }

        if (!IsAuthenticated())
        {
            return Unauthorized();
        }

        if (!IsAdmin() && !IsSameCompany(order.CompanyId))
        {
            return Forbid();
        }

        return Ok(new DataResponse<OrderDto>(order, true));
    }

    [Authorize]
    [HttpPost]
    [ProducesResponseType(typeof(DataResponse<OrderDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
    {
        try
        {
            if (dto == null)
            {
                return BadRequest(new DataResponse(false, new List<ErrorResponse>
                {
                    new("Dados do pedido são obrigatórios.")
                }));
            }

            if (!IsAdmin())
            {
                var currentUserId = GetCurrentUserId();

                if (!IsSameCompany(dto.CompanyId))
                {
                    return Forbid();
                }

                if (!string.IsNullOrWhiteSpace(dto.UserId) &&
                    !string.Equals(dto.UserId, currentUserId, StringComparison.OrdinalIgnoreCase))
                {
                    return Forbid();
                }
            }

            var order = await _orderService.CreateAsync(dto);

            return CreatedAtAction(
                nameof(GetById),
                new { id = order.Id },
                new DataResponse<OrderDto>(order, true)
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

    [HttpPut("{id}")]
    [HttpPatch("{id}")]
    [ProducesResponseType(typeof(DataResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateOrderDto dto)
    {
        try
        {
            if (!IsInternalRequest())
            {
                if (!IsAuthenticated())
                {
                    return Unauthorized();
                }

                if (!IsAdmin())
                {
                    return Forbid();
                }
            }

            var order = await _orderService.UpdateAsync(id, dto);

            if (order == null)
            {
                return OrderNotFound();
            }

            return Ok(new DataResponse<OrderDto>(order, true));
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

        var success = await _orderService.DeleteAsync(id);

        if (!success)
        {
            return OrderNotFound();
        }

        return Ok(new DataResponse(true));
    }

    private bool IsAuthenticated()
    {
        return User?.Identity?.IsAuthenticated == true;
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirst("nameid")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
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
            User.FindFirst("role")?.Value
            ?? User.FindFirst(ClaimTypes.Role)?.Value
            ?? string.Empty
        ).Trim().ToLowerInvariant();
    }

    private bool IsAdmin()
    {
        return GetCurrentRole() == "admin";
    }

    private bool IsSameCompany(string? companyId)
    {
        var currentCompanyId = GetCurrentCompanyId();

        return !string.IsNullOrWhiteSpace(currentCompanyId) &&
               !string.IsNullOrWhiteSpace(companyId) &&
               string.Equals(currentCompanyId, companyId, StringComparison.OrdinalIgnoreCase);
    }

    private bool IsInternalRequest()
    {
        if (!Request.Headers.TryGetValue(InternalApiKeyHeaderName, out var providedKey))
        {
            return false;
        }

        var expectedKey =
            Environment.GetEnvironmentVariable("INTERNAL_API_KEY") ??
            DefaultInternalApiKey;

        return string.Equals(
            providedKey.ToString(),
            expectedKey,
            StringComparison.Ordinal
        );
    }

    private NotFoundObjectResult OrderNotFound()
    {
        return NotFound(new DataResponse(false, new List<ErrorResponse>
        {
            new("Order not found")
        }));
    }
}