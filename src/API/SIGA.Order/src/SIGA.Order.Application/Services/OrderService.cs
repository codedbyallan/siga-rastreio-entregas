using MongoDB.Bson;
using SIGA.Order.Domain.DTOs;
using SIGA.Order.Domain.Interfaces;
using SIGA.Order.Domain.Interfaces.Services;

namespace SIGA.Order.Application.Services;

public class OrderService : IOrderService
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

    private readonly IOrderRepository _orderRepository;

    public OrderService(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository;
    }

    public async Task<OrderDto?> GetByIdAsync(string id)
    {
        if (!ObjectId.TryParse(id, out var objectId))
        {
            return null;
        }

        var order = await _orderRepository.GetByIdAsync(objectId);
        return order != null ? MapToDto(order) : null;
    }

    public async Task<IEnumerable<OrderDto>> GetAllAsync()
    {
        var orders = await _orderRepository.GetAllAsync();
        return orders.Select(MapToDto);
    }

    public async Task<IEnumerable<OrderDto>> GetByCompanyIdAsync(string companyId)
    {
        if (string.IsNullOrWhiteSpace(companyId))
        {
            return Enumerable.Empty<OrderDto>();
        }

        var orders = await _orderRepository.GetByCompanyIdAsync(companyId.Trim());
        return orders.Select(MapToDto);
    }

    public async Task<OrderDto> CreateAsync(CreateOrderDto dto)
    {
        ValidateCreateOrderDto(dto);

        var normalizedStatus = dto.Status.Trim().ToUpperInvariant();

        var order = new Domain.Models.Order
        {
            UserId = dto.UserId.Trim(),
            CompanyId = dto.CompanyId.Trim(),
            TotalPrice = dto.TotalPrice,
            Status = normalizedStatus,
            Items = dto.Items.Select(i => new Domain.Models.OrderItem
            {
                Name = i.Name.Trim(),
                Quantity = i.Quantity,
                Price = i.Price
            }).ToList()
        };

        var createdOrder = await _orderRepository.CreateAsync(order);
        return MapToDto(createdOrder);
    }

    public async Task<OrderDto?> UpdateAsync(string id, UpdateOrderDto dto)
    {
        if (!ObjectId.TryParse(id, out var objectId))
        {
            return null;
        }

        ValidateUpdateOrderDto(dto);

        var existingOrder = await _orderRepository.GetByIdAsync(objectId);

        if (existingOrder == null)
        {
            return null;
        }

        if (dto.UserId != null)
        {
            existingOrder.UserId = dto.UserId.Trim();
        }

        if (dto.CompanyId != null)
        {
            existingOrder.CompanyId = dto.CompanyId.Trim();
        }

        if (dto.TotalPrice != null)
        {
            existingOrder.TotalPrice = dto.TotalPrice.Value;
        }

        if (dto.Status != null)
        {
            var nextStatus = dto.Status.Trim().ToUpperInvariant();

            EnsureFinalStatusIsNotChanged(existingOrder.Status, nextStatus);

            existingOrder.Status = nextStatus;
        }

        if (dto.Items != null)
        {
            existingOrder.Items = dto.Items.Select(i => new Domain.Models.OrderItem
            {
                Name = i.Name.Trim(),
                Quantity = i.Quantity,
                Price = i.Price
            }).ToList();
        }

        existingOrder.UpdatedAt = DateTime.UtcNow;

        var updatedOrder = await _orderRepository.UpdateAsync(objectId, existingOrder);
        return updatedOrder != null ? MapToDto(updatedOrder) : null;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        if (!ObjectId.TryParse(id, out var objectId))
        {
            return false;
        }

        return await _orderRepository.DeleteAsync(objectId);
    }

    private static void ValidateCreateOrderDto(CreateOrderDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentException("Dados do pedido são obrigatórios.");
        }

        if (string.IsNullOrWhiteSpace(dto.UserId))
        {
            throw new ArgumentException("UserId é obrigatório.");
        }

        if (string.IsNullOrWhiteSpace(dto.CompanyId))
        {
            throw new ArgumentException("CompanyId é obrigatório.");
        }

        if (dto.TotalPrice < 0)
        {
            throw new ArgumentException("TotalPrice não pode ser negativo.");
        }

        if (string.IsNullOrWhiteSpace(dto.Status))
        {
            throw new ArgumentException("Status é obrigatório.");
        }

        ValidateStatus(dto.Status);

        if (dto.Items == null || dto.Items.Count == 0)
        {
            throw new ArgumentException("O pedido deve possuir pelo menos um item.");
        }

        ValidateItems(dto.Items);
    }

    private static void ValidateUpdateOrderDto(UpdateOrderDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentException("Dados de atualização do pedido são obrigatórios.");
        }

        if (dto.UserId != null && string.IsNullOrWhiteSpace(dto.UserId))
        {
            throw new ArgumentException("UserId não pode ser vazio.");
        }

        if (dto.CompanyId != null && string.IsNullOrWhiteSpace(dto.CompanyId))
        {
            throw new ArgumentException("CompanyId não pode ser vazio.");
        }

        if (dto.TotalPrice != null && dto.TotalPrice < 0)
        {
            throw new ArgumentException("TotalPrice não pode ser negativo.");
        }

        if (dto.Status != null)
        {
            if (string.IsNullOrWhiteSpace(dto.Status))
            {
                throw new ArgumentException("Status não pode ser vazio.");
            }

            ValidateStatus(dto.Status);
        }

        if (dto.Items != null)
        {
            if (dto.Items.Count == 0)
            {
                throw new ArgumentException("A lista de itens não pode ser vazia.");
            }

            ValidateItems(dto.Items);
        }
    }

    private static void ValidateStatus(string status)
    {
        var normalizedStatus = status.Trim().ToUpperInvariant();

        if (!AllowedStatuses.Contains(normalizedStatus))
        {
            throw new ArgumentException($"Status inválido: {status}.");
        }
    }

    private static void EnsureFinalStatusIsNotChanged(string currentStatus, string nextStatus)
    {
        var normalizedCurrentStatus = currentStatus?.Trim().ToUpperInvariant();

        if (
            (normalizedCurrentStatus == "DELIVERED" || normalizedCurrentStatus == "CANCELED")
            && normalizedCurrentStatus != nextStatus
        )
        {
            throw new InvalidOperationException(
                $"Não é permitido alterar um pedido com status final: {normalizedCurrentStatus}."
            );
        }
    }

    private static void ValidateItems(List<OrderItemDto> items)
    {
        for (var index = 0; index < items.Count; index++)
        {
            var item = items[index];

            if (item == null)
            {
                throw new ArgumentException($"Item {index + 1} é obrigatório.");
            }

            if (string.IsNullOrWhiteSpace(item.Name))
            {
                throw new ArgumentException($"Item {index + 1}: nome é obrigatório.");
            }

            if (item.Quantity <= 0)
            {
                throw new ArgumentException($"Item {index + 1}: quantidade deve ser maior que zero.");
            }

            if (item.Price < 0)
            {
                throw new ArgumentException($"Item {index + 1}: preço não pode ser negativo.");
            }
        }
    }

    private static OrderDto MapToDto(Domain.Models.Order order)
    {
        return new OrderDto
        {
            Id = order.Id.ToString(),
            UserId = order.UserId,
            CompanyId = order.CompanyId,
            TotalPrice = order.TotalPrice,
            Status = order.Status,
            Items = order.Items.Select(i => new OrderItemDto
            {
                Name = i.Name,
                Quantity = i.Quantity,
                Price = i.Price
            }).ToList(),
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt
        };
    }
}