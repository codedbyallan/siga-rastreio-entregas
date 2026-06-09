using SIGA.Delivery.Application.Clients;
using SIGA.Delivery.Application.Interfaces;
using SIGA.Delivery.Domain.DTOs;
using SIGA.Delivery.Domain.Interfaces;
using SIGA.Delivery.Domain.Models;

namespace SIGA.Delivery.Application.Services
{
    public class DeliveryEventService : IDeliveryEventService
    {
        private static readonly string[] AllowedStatuses =
        {
            "CREATED",
            "POSTED",
            "IN_TRANSIT",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "CANCELED"
        };

        private static readonly string[] AllowedEventTypes =
        {
            "DELIVERY_CREATED",
            "DELIVERY_POSTED",
            "DELIVERY_IN_TRANSIT",
            "DELIVERY_OUT_FOR_DELIVERY",
            "DELIVERY_DELIVERED",
            "DELIVERY_CANCELED",
            "DELIVERY_UPDATED",
            "DELIVERY_ATTEMPT_FAILED"
        };

        private static readonly Dictionary<string, string> ExpectedEventTypeByStatus = new()
        {
            ["CREATED"] = "DELIVERY_CREATED",
            ["POSTED"] = "DELIVERY_POSTED",
            ["IN_TRANSIT"] = "DELIVERY_IN_TRANSIT",
            ["OUT_FOR_DELIVERY"] = "DELIVERY_OUT_FOR_DELIVERY",
            ["DELIVERED"] = "DELIVERY_DELIVERED",
            ["CANCELED"] = "DELIVERY_CANCELED"
        };

        private static readonly Dictionary<string, string[]> AllowedNextStatusesByCurrentStatus = new()
        {
            ["CREATED"] = new[] { "POSTED", "CANCELED" },
            ["POSTED"] = new[] { "IN_TRANSIT", "CANCELED" },
            ["IN_TRANSIT"] = new[] { "OUT_FOR_DELIVERY", "CANCELED" },
            ["OUT_FOR_DELIVERY"] = new[] { "DELIVERED", "CANCELED" },
            ["DELIVERED"] = Array.Empty<string>(),
            ["CANCELED"] = Array.Empty<string>()
        };

        private static readonly Dictionary<string, string[]> AllowedStatusesByActorType = new()
        {
            ["ADMIN"] = new[] { "CREATED", "POSTED", "IN_TRANSIT", "CANCELED" },
            ["COMPANY_OPERATOR"] = new[] { "CREATED", "POSTED", "IN_TRANSIT", "CANCELED" },
            ["COURIER"] = new[] { "OUT_FOR_DELIVERY", "DELIVERED" },
            ["SYSTEM"] = new[] { "CREATED" }
        };

        private readonly IDeliveryEventRepository _deliveryEventRepository;
        private readonly IDeliveryRepository _deliveryRepository;
        private readonly IOrderApiClient _orderApiClient;

        public DeliveryEventService(
            IDeliveryEventRepository deliveryEventRepository,
            IDeliveryRepository deliveryRepository,
            IOrderApiClient orderApiClient)
        {
            _deliveryEventRepository = deliveryEventRepository;
            _deliveryRepository = deliveryRepository;
            _orderApiClient = orderApiClient;
        }

        public async Task<DeliveryEvent> CreateDeliveryEventAsync(CreateDeliveryEventDto dto)
        {
            if (dto == null)
            {
                throw new ArgumentNullException(nameof(dto));
            }

            var normalizedDeliveryId = (dto.DeliveryId ?? string.Empty).Trim();
            var normalizedOrderId = (dto.OrderId ?? string.Empty).Trim();
            var normalizedStatus = (dto.Status ?? string.Empty).Trim().ToUpperInvariant();
            var normalizedEventType = (dto.EventType ?? string.Empty).Trim().ToUpperInvariant();

            ValidateCreateEventDto(
                normalizedDeliveryId,
                normalizedOrderId,
                normalizedStatus,
                dto.Description,
                normalizedEventType,
                dto.Actor
            );

            var delivery = await _deliveryRepository.GetByIdAsync(normalizedDeliveryId);

            if (delivery == null)
            {
                throw new InvalidOperationException("Entrega não encontrada.");
            }

            if (!string.Equals(delivery.OrderId, normalizedOrderId, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("O pedido informado não pertence à entrega informada.");
            }

            ValidateEventTypeMatchesStatus(normalizedStatus, normalizedEventType);
            ValidateActorCanCreateStatus(dto.Actor.Type, normalizedStatus);
            ValidateStatusTransition(delivery.Status, normalizedStatus, normalizedEventType);

try
{
    var orderResponse = await _orderApiClient.GetOrderByIdAsync(normalizedOrderId);

    if (orderResponse?.Data == null)
    {
        throw new InvalidOperationException("Pedido não encontrado no sistema de Pedidos.");
    }
}
catch
{
    throw new InvalidOperationException("Pedido não encontrado no sistema de Pedidos.");
}

            var deliveryEvent = new DeliveryEvent
            {
                DeliveryId = normalizedDeliveryId,
                OrderId = normalizedOrderId,
                Status = normalizedStatus,
                Description = dto.Description.Trim(),
                EventType = normalizedEventType,
                CreatedAt = DateTime.UtcNow,
                Actor = new Actor
                {
                    Type = dto.Actor.Type.Trim().ToUpperInvariant(),
                    Id = dto.Actor.Id.Trim()
                }
            };

            var deliveryUpdated = await _deliveryRepository.UpdateStatusAsync(
                normalizedDeliveryId,
                normalizedStatus
            );

            if (!deliveryUpdated)
            {
                throw new InvalidOperationException("Não foi possível atualizar o status da entrega.");
            }

            await _orderApiClient.UpdateOrderStatusAsync(
                normalizedOrderId,
                new UpdateOrderDto
                {
                    Status = normalizedStatus
                }
            );

            await _deliveryEventRepository.CreateAsync(deliveryEvent);

            return deliveryEvent;
        }

        public async Task<DeliveryEvent?> GetDeliveryEventByIdAsync(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                throw new ArgumentException("O ID do evento de entrega é obrigatório.", nameof(id));
            }

            return await _deliveryEventRepository.GetByIdAsync(id);
        }

        public async Task<List<DeliveryEvent>> GetDeliveryEventsByDeliveryIdAsync(string deliveryId)
        {
            if (string.IsNullOrWhiteSpace(deliveryId))
            {
                throw new ArgumentException("O ID de entrega é obrigatório.", nameof(deliveryId));
            }

            return await _deliveryEventRepository.GetByDeliveryIdAsync(deliveryId);
        }

        public async Task<List<DeliveryEvent>> GetDeliveryEventsByOrderIdAsync(string orderId)
        {
            if (string.IsNullOrWhiteSpace(orderId))
            {
                throw new ArgumentException("O ID do pedido é obrigatório.", nameof(orderId));
            }

            return await _deliveryEventRepository.GetByOrderIdAsync(orderId);
        }

        public async Task<List<DeliveryEvent>> GetAllDeliveryEventsAsync()
        {
            return await _deliveryEventRepository.GetAllAsync();
        }

        public async Task<DeliveryEvent?> GetLatestEventByDeliveryIdAsync(string deliveryId)
        {
            if (string.IsNullOrWhiteSpace(deliveryId))
            {
                throw new ArgumentException(
                    "O ID da entrega é obrigatório para buscar o último evento.",
                    nameof(deliveryId)
                );
            }

            var events = await _deliveryEventRepository.GetByDeliveryIdAsync(deliveryId);

            return events
                .OrderByDescending(e => e.CreatedAt)
                .FirstOrDefault();
        }

        private static void ValidateCreateEventDto(
            string deliveryId,
            string orderId,
            string status,
            string description,
            string eventType,
            Actor actor)
        {
            if (string.IsNullOrWhiteSpace(deliveryId))
            {
                throw new ArgumentException("DeliveryId é obrigatório.");
            }

            if (string.IsNullOrWhiteSpace(orderId))
            {
                throw new ArgumentException("OrderId é obrigatório.");
            }

            if (string.IsNullOrWhiteSpace(status))
            {
                throw new ArgumentException("Status é obrigatório.");
            }

            if (!AllowedStatuses.Contains(status))
            {
                throw new ArgumentException($"Status inválido: {status}.");
            }

            if (string.IsNullOrWhiteSpace(description))
            {
                throw new ArgumentException("Description é obrigatório.");
            }

            if (string.IsNullOrWhiteSpace(eventType))
            {
                throw new ArgumentException("EventType é obrigatório.");
            }

            if (!AllowedEventTypes.Contains(eventType))
            {
                throw new ArgumentException($"EventType inválido: {eventType}.");
            }

            if (actor == null)
            {
                throw new ArgumentException("Actor é obrigatório.");
            }

            if (string.IsNullOrWhiteSpace(actor.Type))
            {
                throw new ArgumentException("Actor.Type é obrigatório.");
            }

            if (string.IsNullOrWhiteSpace(actor.Id))
            {
                throw new ArgumentException("Actor.Id é obrigatório.");
            }
        }

        private static void ValidateEventTypeMatchesStatus(string status, string eventType)
        {
            if (!ExpectedEventTypeByStatus.TryGetValue(status, out var expectedEventType))
            {
                return;
            }

            if (!string.Equals(expectedEventType, eventType, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    $"EventType inválido para o status {status}. Esperado: {expectedEventType}."
                );
            }
        }

        private static void ValidateActorCanCreateStatus(string actorType, string nextStatus)
        {
            var normalizedActorType = actorType?.Trim().ToUpperInvariant() ?? string.Empty;

            if (!AllowedStatusesByActorType.TryGetValue(normalizedActorType, out var allowedStatuses))
            {
                throw new InvalidOperationException(
                    $"Perfil não autorizado para registrar evento de entrega: {normalizedActorType}."
                );
            }

            if (!allowedStatuses.Contains(nextStatus))
            {
                throw new InvalidOperationException(
                    $"O perfil {normalizedActorType} não pode alterar a entrega para o status {nextStatus}."
                );
            }
        }

        private static void ValidateStatusTransition(string currentStatus, string nextStatus, string eventType)
        {
            var normalizedCurrentStatus = currentStatus?.Trim().ToUpperInvariant() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(normalizedCurrentStatus))
            {
                throw new InvalidOperationException("Status atual da entrega está inválido.");
            }

            if (!AllowedStatuses.Contains(normalizedCurrentStatus))
            {
                throw new InvalidOperationException($"Status atual da entrega é inválido: {normalizedCurrentStatus}.");
            }

            if (normalizedCurrentStatus == "DELIVERED" || normalizedCurrentStatus == "CANCELED")
            {
                throw new InvalidOperationException(
                    $"Não é permitido atualizar uma entrega com status final: {normalizedCurrentStatus}."
                );
            }

            if (string.Equals(normalizedCurrentStatus, nextStatus, StringComparison.OrdinalIgnoreCase))
            {
                if (normalizedCurrentStatus == "CREATED" && eventType == "DELIVERY_CREATED")
                {
                    return;
                }

                throw new InvalidOperationException(
                    $"A entrega já está com o status {normalizedCurrentStatus}."
                );
            }

            if (!AllowedNextStatusesByCurrentStatus.TryGetValue(normalizedCurrentStatus, out var allowedNextStatuses))
            {
                throw new InvalidOperationException($"Não há fluxo definido para o status atual: {normalizedCurrentStatus}.");
            }

            if (!allowedNextStatuses.Contains(nextStatus))
            {
                throw new InvalidOperationException(
                    $"Transição de status inválida: {normalizedCurrentStatus} → {nextStatus}."
                );
            }
        }
    }
}