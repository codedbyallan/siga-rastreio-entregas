using System.Collections.Generic;
using System.Threading.Tasks;
using SIGA.Delivery.Domain.Models;

namespace SIGA.Delivery.Domain.Interfaces
{
    public interface IDeliveryEventRepository
    {
        Task CreateAsync(DeliveryEvent deliveryEvent);
        Task<DeliveryEvent?> GetByIdAsync(string id);
        Task<List<DeliveryEvent>> GetByDeliveryIdAsync(string deliveryId);
        Task<List<DeliveryEvent>> GetByOrderIdAsync(string orderId);
        Task<List<DeliveryEvent>> GetAllAsync();
    }
}
