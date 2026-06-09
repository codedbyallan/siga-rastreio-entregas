using DeliveryModel = SIGA.Delivery.Domain.Models.Delivery;

namespace SIGA.Delivery.Domain.Interfaces;

public interface IDeliveryRepository
{
    Task<IEnumerable<DeliveryModel>> GetAllAsync();
    Task<DeliveryModel> CreateAsync(DeliveryModel delivery);
    Task<DeliveryModel?> GetByIdAsync(string id);
    Task<DeliveryModel?> GetByTrackingCodeAsync(string trackingCode);
    Task<DeliveryModel?> GetByOrderIdAsync(string orderId);
    Task<IEnumerable<DeliveryModel>> GetByCourierIdAsync(string courierId);
    Task<bool> ExistsByTrackingCodeAsync(string trackingCode);
    Task<bool> UpdateStatusAsync(string id, string status);
    Task<DeliveryModel?> AssignCourierAsync(string id, string courierId);
}