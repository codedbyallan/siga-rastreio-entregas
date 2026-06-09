using SIGA.Delivery.Application.Clients;
using SIGA.Delivery.Domain.DTOs;
using SIGA.Delivery.Domain.Interfaces;
using SIGA.Delivery.Domain.Interfaces.Services;
using SIGA.Delivery.Domain.Models;
using DeliveryModel = SIGA.Delivery.Domain.Models.Delivery;
using OrderModel = SIGA.Delivery.Domain.Models.Order;

namespace SIGA.Delivery.Application.Services;

public class DeliveryService : IDeliveryService
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

    private readonly IDeliveryRepository _deliveryRepository;
    private readonly IDeliveryEventRepository _deliveryEventRepository;
    private readonly IOrderApiClient _orderApiClient;
    private readonly IUserApiClient _userApiClient;

    public DeliveryService(
        IDeliveryRepository deliveryRepository,
        IDeliveryEventRepository deliveryEventRepository,
        IOrderApiClient orderApiClient,
        IUserApiClient userApiClient)
    {
        _deliveryRepository = deliveryRepository;
        _deliveryEventRepository = deliveryEventRepository;
        _orderApiClient = orderApiClient;
        _userApiClient = userApiClient;
    }

    public async Task<IEnumerable<DeliveryDto>> GetAllAsync()
    {
        var deliveries = await _deliveryRepository.GetAllAsync();
        return deliveries.Select(MapToDto);
    }

    public async Task<DeliveryDto?> GetByIdAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return null;
        }

        var delivery = await _deliveryRepository.GetByIdAsync(id.Trim());
        return delivery == null ? null : MapToDto(delivery);
    }

    public async Task<IEnumerable<DeliveryDto>> GetByCourierIdAsync(string courierId)
    {
        if (string.IsNullOrWhiteSpace(courierId))
        {
            throw new ArgumentException("CourierId é obrigatório.");
        }

        var deliveries = await _deliveryRepository.GetByCourierIdAsync(courierId.Trim());
        return deliveries.Select(MapToDto);
    }

    public async Task<DeliveryDto> CreateAsync(CreateDeliveryDto dto)
    {
        ValidateCreateDeliveryDto(dto);

        var normalizedOrderId = dto.OrderId.Trim();
        var normalizedTrackingCode = dto.TrackingCode!.Trim().ToUpperInvariant();
        var normalizedStatus = dto.Status.Trim().ToUpperInvariant();

        var trackingCodeAlreadyExists =
            await _deliveryRepository.ExistsByTrackingCodeAsync(normalizedTrackingCode);

        if (trackingCodeAlreadyExists)
        {
            throw new InvalidOperationException("Código de rastreio já cadastrado.");
        }

try
{
    var orderResponse = await _orderApiClient.GetOrderByIdAsync(normalizedOrderId);
    var order = orderResponse?.Data;

    if (order == null)
    {
        throw new InvalidOperationException(
            $"Não foi possível criar a entrega. O pedido {normalizedOrderId} não existe no sistema de Pedidos."
        );
    }
}
catch
{
    throw new InvalidOperationException(
        $"Não foi possível criar a entrega. O pedido {normalizedOrderId} não existe no sistema de Pedidos."
    );
}

        var delivery = new DeliveryModel
        {
            OrderId = normalizedOrderId,
            CourierId = string.IsNullOrWhiteSpace(dto.CourierId) ? null : dto.CourierId.Trim(),
            Status = normalizedStatus,
            EstimatedDeliveryDate = dto.EstimatedDeliveryDate,
            CreatedAt = DateTime.UtcNow,

            TrackingCode = normalizedTrackingCode,
            Carrier = dto.Carrier!.Trim(),
            PostingDate = dto.PostingDate,

            Address = MapAddressDtoToModel(dto.Address),
            OriginAddress = MapAddressDtoToModel(dto.OriginAddress!)
        };

        var created = await _deliveryRepository.CreateAsync(delivery);

        return MapToDto(created);
    }

    public async Task<DeliveryDto?> AssignCourierAsync(
        string deliveryId,
        string courierId,
        string currentUserRole,
        string? currentUserCompanyId)
    {
        if (string.IsNullOrWhiteSpace(deliveryId))
        {
            throw new ArgumentException("DeliveryId é obrigatório.");
        }

        if (string.IsNullOrWhiteSpace(courierId))
        {
            throw new ArgumentException("CourierId é obrigatório.");
        }

        var normalizedDeliveryId = deliveryId.Trim();
        var normalizedCourierId = courierId.Trim();
        var normalizedCurrentUserRole = currentUserRole?.Trim().ToLowerInvariant() ?? string.Empty;
        var normalizedCurrentUserCompanyId = currentUserCompanyId?.Trim();

        if (normalizedCurrentUserRole != "admin" && normalizedCurrentUserRole != "company_operator")
        {
            throw new InvalidOperationException("Perfil não autorizado para atribuir entregador.");
        }

        var currentDelivery = await _deliveryRepository.GetByIdAsync(normalizedDeliveryId);

        if (currentDelivery == null)
        {
            return null;
        }

        var order = await GetOrderOrThrowAsync(currentDelivery.OrderId);
        var courier = await GetCourierOrThrowAsync(normalizedCourierId);

        var orderCompanyId = order.CompanyId?.Trim();
        var courierCompanyId = courier.CompanyId?.Trim();

        if (string.IsNullOrWhiteSpace(orderCompanyId))
        {
            throw new InvalidOperationException("Pedido não possui empresa vinculada.");
        }

        if (string.IsNullOrWhiteSpace(courierCompanyId))
        {
            throw new InvalidOperationException("Entregador não possui empresa vinculada.");
        }

        if (!string.Equals(courierCompanyId, orderCompanyId, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "O entregador informado não pertence à mesma empresa da entrega."
            );
        }

        if (normalizedCurrentUserRole == "company_operator")
        {
            if (string.IsNullOrWhiteSpace(normalizedCurrentUserCompanyId))
            {
                throw new InvalidOperationException("Operador não possui empresa vinculada.");
            }

            if (!string.Equals(normalizedCurrentUserCompanyId, orderCompanyId, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Operador não pode atribuir entregador a uma entrega de outra empresa."
                );
            }
        }

        var delivery = await _deliveryRepository.AssignCourierAsync(
            normalizedDeliveryId,
            normalizedCourierId
        );

        return delivery == null ? null : MapToDto(delivery);
    }

private async Task<OrderModel> GetOrderOrThrowAsync(string orderId)
{
    if (string.IsNullOrWhiteSpace(orderId))
    {
        throw new InvalidOperationException("Entrega não possui pedido vinculado.");
    }

    try
    {
        var orderResponse = await _orderApiClient.GetOrderByIdAsync(orderId.Trim());
        var order = orderResponse?.Data;

        if (order == null)
        {
            throw new InvalidOperationException("Pedido da entrega não encontrado.");
        }

        return order;
    }
    catch
    {
        throw new InvalidOperationException("Pedido da entrega não encontrado no sistema de Pedidos.");
    }
}
    private async Task<UserClientDto> GetCourierOrThrowAsync(string courierId)
    {
        try
        {
            var courier = await _userApiClient.GetUserByIdAsync(courierId.Trim());

            if (courier == null)
            {
                throw new InvalidOperationException("Entregador não encontrado.");
            }

            var normalizedRole = courier.Role?.Trim().ToLowerInvariant();

            if (normalizedRole != "courier")
            {
                throw new InvalidOperationException("O usuário informado não possui perfil de entregador.");
            }

            return courier;
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch
        {
            throw new InvalidOperationException("Entregador não encontrado no sistema de Usuários.");
        }
    }

    public async Task<DeliveryTrackingDto?> GetByTrackingCodeAsync(string trackingCode)
    {
        if (string.IsNullOrWhiteSpace(trackingCode))
        {
            return null;
        }

        var delivery = await _deliveryRepository.GetByTrackingCodeAsync(trackingCode);

        if (delivery == null)
        {
            return null;
        }

        return await BuildDeliveryTrackingDtoAsync(delivery);
    }

    public async Task<DeliveryTrackingDto?> GetByOrderIdAsync(string orderId)
    {
        if (string.IsNullOrWhiteSpace(orderId))
        {
            return null;
        }

        var delivery = await _deliveryRepository.GetByOrderIdAsync(orderId.Trim());

        if (delivery == null)
        {
            return null;
        }

        return await BuildDeliveryTrackingDtoAsync(delivery);
    }

    private static void ValidateCreateDeliveryDto(CreateDeliveryDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentException("Dados da entrega são obrigatórios.");
        }

        if (string.IsNullOrWhiteSpace(dto.OrderId))
        {
            throw new ArgumentException("OrderId é obrigatório.");
        }

        if (string.IsNullOrWhiteSpace(dto.TrackingCode))
        {
            throw new ArgumentException("Código de rastreio é obrigatório.");
        }

        if (string.IsNullOrWhiteSpace(dto.Carrier))
        {
            throw new ArgumentException("Transportadora é obrigatória.");
        }

        if (dto.PostingDate == null)
        {
            throw new ArgumentException("Data de postagem é obrigatória.");
        }

        if (string.IsNullOrWhiteSpace(dto.Status))
        {
            throw new ArgumentException("Status é obrigatório.");
        }

        var normalizedStatus = dto.Status.Trim().ToUpperInvariant();

        if (!AllowedStatuses.Contains(normalizedStatus))
        {
            throw new ArgumentException($"Status inválido: {dto.Status}.");
        }

        ValidateAddress(dto.Address, "Endereço de destino");

        if (dto.OriginAddress == null)
        {
            throw new ArgumentException("Endereço de origem é obrigatório.");
        }

        ValidateAddress(dto.OriginAddress, "Endereço de origem");
    }

    private static void ValidateAddress(AddressDto? address, string label)
    {
        if (address == null)
        {
            throw new ArgumentException($"{label} é obrigatório.");
        }

        if (string.IsNullOrWhiteSpace(address.Street))
        {
            throw new ArgumentException($"{label}: rua é obrigatória.");
        }

        if (string.IsNullOrWhiteSpace(address.Number))
        {
            throw new ArgumentException($"{label}: número é obrigatório.");
        }

        if (string.IsNullOrWhiteSpace(address.City))
        {
            throw new ArgumentException($"{label}: cidade é obrigatória.");
        }

        if (string.IsNullOrWhiteSpace(address.State))
        {
            throw new ArgumentException($"{label}: UF é obrigatória.");
        }

        if (string.IsNullOrWhiteSpace(address.PostalCode))
        {
            throw new ArgumentException($"{label}: CEP é obrigatório.");
        }
    }

    private async Task<DeliveryTrackingDto> BuildDeliveryTrackingDtoAsync(DeliveryModel delivery)
    {
        var deliveryId = delivery.Id.ToString();
        var events = await _deliveryEventRepository.GetByDeliveryIdAsync(deliveryId);

        return new DeliveryTrackingDto
        {
            Delivery = MapToDto(delivery),
            Events = events.Select(MapEventToTrackingDto).ToList()
        };
    }

    private static DeliveryDto MapToDto(DeliveryModel delivery)
    {
        return new DeliveryDto
        {
            Id = delivery.Id.ToString(),
            OrderId = delivery.OrderId,
            CourierId = delivery.CourierId,

            Address = MapAddressModelToDto(delivery.Address),
            OriginAddress = delivery.OriginAddress == null
                ? null
                : MapAddressModelToDto(delivery.OriginAddress),

            TrackingCode = delivery.TrackingCode,
            Carrier = delivery.Carrier,
            PostingDate = delivery.PostingDate,

            Status = delivery.Status,
            EstimatedDeliveryDate = delivery.EstimatedDeliveryDate,
            CreatedAt = delivery.CreatedAt
        };
    }

    private static DeliveryTrackingEventDto MapEventToTrackingDto(DeliveryEvent deliveryEvent)
    {
        return new DeliveryTrackingEventDto
        {
            Id = deliveryEvent.Id,
            DeliveryId = deliveryEvent.DeliveryId,
            OrderId = deliveryEvent.OrderId,
            Status = deliveryEvent.Status,
            Description = deliveryEvent.Description,
            EventType = deliveryEvent.EventType,
            CreatedAt = deliveryEvent.CreatedAt,
            Actor = deliveryEvent.Actor == null
                ? null
                : new DeliveryTrackingActorDto
                {
                    Type = deliveryEvent.Actor.Type,
                    Id = deliveryEvent.Actor.Id
                }
        };
    }

    private static Address MapAddressDtoToModel(AddressDto address)
    {
        return new Address
        {
            Street = address.Street.Trim(),
            Number = address.Number?.Trim(),
            Neighborhood = address.Neighborhood?.Trim(),
            City = address.City.Trim(),
            State = address.State.Trim().ToUpperInvariant(),
            PostalCode = address.PostalCode.Trim()
        };
    }

    private static AddressDto MapAddressModelToDto(Address address)
    {
        return new AddressDto
        {
            Street = address.Street,
            Number = address.Number,
            Neighborhood = address.Neighborhood,
            City = address.City,
            State = address.State,
            PostalCode = address.PostalCode
        };
    }
}