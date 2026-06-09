using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGA.Delivery.Domain.DTOs;
using SIGA.Delivery.Domain.Interfaces.Services;
using SIGA.Delivery.Domain.Responses;
using System.Security.Claims;

namespace SIGA.Delivery.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DeliveriesController : ControllerBase
{
    private readonly IDeliveryService _deliveryService;

    public DeliveriesController(IDeliveryService deliveryService)
    {
        _deliveryService = deliveryService;
    }

    [Authorize]
    [HttpGet]
    [ProducesResponseType(typeof(DataResponse<IEnumerable<DeliveryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        if (!IsAdmin())
        {
            return Forbid();
        }

        var deliveries = await _deliveryService.GetAllAsync();
        return Ok(new DataResponse<IEnumerable<DeliveryDto>>(deliveries, true));
    }

    [AllowAnonymous]
    [HttpGet("tracking/{trackingCode}")]
    [ProducesResponseType(typeof(DataResponse<DeliveryTrackingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByTrackingCode(string trackingCode)
    {
        var trackingResult = await _deliveryService.GetByTrackingCodeAsync(trackingCode);

        if (trackingResult == null)
        {
            return NotFound(new DataResponse(false, new List<ErrorResponse>
            {
                new("Entrega não encontrada para o código de rastreio informado.")
            }));
        }

        return Ok(new DataResponse<DeliveryTrackingDto>(trackingResult, true));
    }

    [Authorize]
    [HttpGet("order/{orderId}")]
    [ProducesResponseType(typeof(DataResponse<DeliveryTrackingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByOrderId(string orderId)
    {
        var deliveryDetails = await _deliveryService.GetByOrderIdAsync(orderId);

        if (deliveryDetails == null)
        {
            return NotFound(new DataResponse(false, new List<ErrorResponse>
            {
                new("Entrega não encontrada para o pedido informado.")
            }));
        }

        return Ok(new DataResponse<DeliveryTrackingDto>(deliveryDetails, true));
    }

    [Authorize]
    [HttpGet("courier/{courierId}")]
    [ProducesResponseType(typeof(DataResponse<IEnumerable<DeliveryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByCourierId(string courierId)
    {
        if (!IsAdmin() && !IsCurrentCourier(courierId))
        {
            return Forbid();
        }

        var deliveries = await _deliveryService.GetByCourierIdAsync(courierId);
        return Ok(new DataResponse<IEnumerable<DeliveryDto>>(deliveries, true));
    }

    [Authorize]
    [HttpPost]
    [ProducesResponseType(typeof(DataResponse<DeliveryDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateDeliveryDto dto)
    {
        try
        {
            var delivery = await _deliveryService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetAll), new DataResponse<DeliveryDto>(delivery, true));
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
    [HttpPatch("{deliveryId}/assign-courier")]
    [ProducesResponseType(typeof(DataResponse<DeliveryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignCourier(string deliveryId, [FromBody] AssignCourierDto dto)
    {
        try
        {
            if (!IsAdmin() && !IsCompanyOperator())
            {
                return Forbid();
            }

            if (dto == null || string.IsNullOrWhiteSpace(dto.CourierId))
            {
                return BadRequest(new DataResponse(false, new List<ErrorResponse>
                {
                    new("CourierId é obrigatório.")
                }));
            }

            var delivery = await _deliveryService.AssignCourierAsync(
                deliveryId,
                dto.CourierId,
                GetCurrentRole(),
                GetCurrentCompanyId()
            );

            if (delivery == null)
            {
                return NotFound(new DataResponse(false, new List<ErrorResponse>
                {
                    new("Entrega não encontrada.")
                }));
            }

            return Ok(new DataResponse<DeliveryDto>(delivery, true));
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

    private bool IsCompanyOperator()
    {
        return GetCurrentRole() == "company_operator";
    }

    private bool IsCourier()
    {
        return GetCurrentRole() == "courier";
    }

    private bool IsCurrentCourier(string courierId)
    {
        return IsCourier()
            && !string.IsNullOrWhiteSpace(courierId)
            && string.Equals(GetCurrentUserId(), courierId, StringComparison.OrdinalIgnoreCase);
    }
}