using SIGA.Delivery.Domain.DTOs;

namespace SIGA.Delivery.Domain.Interfaces.Services;

public interface IDeliveryService
{
    Task<IEnumerable<DeliveryDto>> GetAllAsync();
    Task<DeliveryDto?> GetByIdAsync(string id);
    Task<IEnumerable<DeliveryDto>> GetByCourierIdAsync(string courierId);
    Task<DeliveryDto> CreateAsync(CreateDeliveryDto dto);
    Task<DeliveryDto?> AssignCourierAsync(
    string deliveryId,
    string courierId,
    string currentUserRole,
    string? currentUserCompanyId
);
    Task<DeliveryTrackingDto?> GetByTrackingCodeAsync(string trackingCode);
    Task<DeliveryTrackingDto?> GetByOrderIdAsync(string orderId);
}