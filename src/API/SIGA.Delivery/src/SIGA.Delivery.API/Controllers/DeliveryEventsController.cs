using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGA.Delivery.Application.Interfaces;
using SIGA.Delivery.Domain.DTOs;
using SIGA.Delivery.Domain.Interfaces.Services;
using SIGA.Delivery.Domain.Models;
using System.Linq;
using System.Security.Claims;

namespace SIGA.Delivery.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DeliveryEventsController : ControllerBase
{
    private readonly IDeliveryEventService _deliveryEventService;
    private readonly IDeliveryService _deliveryService;

    public DeliveryEventsController(
        IDeliveryEventService deliveryEventService,
        IDeliveryService deliveryService)
    {
        _deliveryEventService = deliveryEventService;
        _deliveryService = deliveryService;
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateDeliveryEvent([FromBody] CreateDeliveryEventDto dto)
    {
        try
        {
            if (dto == null)
            {
                return BadRequest(new { Message = "Dados do evento são obrigatórios." });
            }

            var authorizationResult = await ValidateEventCreationPermissionAsync(dto);

            if (authorizationResult != null)
            {
                return authorizationResult;
            }

            NormalizeActorFromAuthenticatedUser(dto);

            var deliveryEvent = await _deliveryEventService.CreateDeliveryEventAsync(dto);

            return CreatedAtAction(
                nameof(GetDeliveryEventById),
                new { id = deliveryEvent.Id },
                new
                {
                    Message = "Evento de entrega registrado com sucesso.",
                    Data = deliveryEvent
                });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAllDeliveryEvents()
    {
        if (!IsAdmin())
        {
            return Forbid();
        }

        var deliveryEvents = await _deliveryEventService.GetAllDeliveryEventsAsync();

        return Ok(new
        {
            Message = "Eventos recuperados com sucesso!",
            Total = deliveryEvents.Count,
            Data = deliveryEvents
        });
    }

    [Authorize]
    [HttpGet("{id}", Name = "GetDeliveryEvent")]
    public async Task<IActionResult> GetDeliveryEventById([FromRoute] string id)
    {
        var deliveryEvent = await _deliveryEventService.GetDeliveryEventByIdAsync(id);

        if (deliveryEvent == null)
        {
            return NotFound("Evento não encontrado.");
        }

        return Ok(new
        {
            Message = "Evento encontrado com sucesso!",
            DeliveryEvent = deliveryEvent
        });
    }

    [Authorize]
    [HttpGet("delivery/{deliveryId}")]
    public async Task<IActionResult> GetDeliveryEventsByDeliveryId([FromRoute] string deliveryId)
    {
        var deliveryEvents = await _deliveryEventService.GetDeliveryEventsByDeliveryIdAsync(deliveryId);

        if (deliveryEvents == null || !deliveryEvents.Any())
        {
            return NotFound($"Nenhum evento encontrado para a entrega: {deliveryId}");
        }

        return Ok(new
        {
            Message = "Eventos de entrega recuperados com sucesso!",
            Count = deliveryEvents.Count,
            Data = deliveryEvents
        });
    }

    [Authorize]
    [HttpGet("order/{orderId}")]
    public async Task<IActionResult> GetDeliveryEventsByOrderId([FromRoute] string orderId)
    {
        var deliveryEvents = await _deliveryEventService.GetDeliveryEventsByOrderIdAsync(orderId);

        if (deliveryEvents == null || !deliveryEvents.Any())
        {
            return NotFound(new
            {
                Message = $"Nenhum histórico de entrega encontrado para o pedido {orderId}."
            });
        }

        return Ok(new
        {
            Message = "Histórico de entrega recuperado com sucesso!",
            TotalEvents = deliveryEvents.Count,
            Events = deliveryEvents
        });
    }

    [Authorize]
    [HttpGet("latest/{deliveryId}")]
    public async Task<IActionResult> GetLatestEventByDeliveryId([FromRoute] string deliveryId)
    {
        var latestEvent = await _deliveryEventService.GetLatestEventByDeliveryIdAsync(deliveryId);

        if (latestEvent == null)
        {
            return NotFound(new
            {
                Message = $"Nenhum evento encontrado para a entrega {deliveryId}."
            });
        }

        return Ok(new
        {
            Message = "Último status da entrega recuperado com sucesso!",
            LatestEvent = latestEvent
        });
    }

    private async Task<IActionResult?> ValidateEventCreationPermissionAsync(CreateDeliveryEventDto dto)
    {
        if (IsAdmin() || IsCompanyOperator())
        {
            return null;
        }

        if (!IsCourier())
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(dto.DeliveryId))
        {
            return BadRequest(new { Message = "DeliveryId é obrigatório." });
        }

        var currentUserId = GetCurrentUserId();

        if (string.IsNullOrWhiteSpace(currentUserId))
        {
            return Forbid();
        }

        var delivery = await _deliveryService.GetByIdAsync(dto.DeliveryId);

        if (delivery == null)
        {
            return NotFound(new { Message = "Entrega não encontrada." });
        }

        if (string.IsNullOrWhiteSpace(delivery.CourierId))
        {
            return Forbid();
        }

        if (!string.Equals(delivery.CourierId, currentUserId, StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        return null;
    }

    private void NormalizeActorFromAuthenticatedUser(CreateDeliveryEventDto dto)
{
    var currentUserId = GetCurrentUserId();

    if (string.IsNullOrWhiteSpace(currentUserId))
    {
        return;
    }

    if (dto.Actor == null)
    {
        dto.Actor = new Actor();
    }

    var currentRole = GetCurrentRole();

    dto.Actor.Id = currentUserId;

    dto.Actor.Type = currentRole switch
    {
        "admin" => "ADMIN",
        "company_operator" => "COMPANY_OPERATOR",
        "courier" => "COURIER",
        _ => currentRole.ToUpperInvariant()
    };
}

    private string? GetCurrentUserId()
    {
        return User.FindFirst("nameid")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
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
}