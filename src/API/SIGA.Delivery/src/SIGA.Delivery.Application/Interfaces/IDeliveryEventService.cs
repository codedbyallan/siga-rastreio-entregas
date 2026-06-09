using SIGA.Delivery.Domain.DTOs;
using SIGA.Delivery.Domain.Models;

namespace SIGA.Delivery.Application.Interfaces;

public interface IDeliveryEventService
{
    Task<DeliveryEvent> CreateDeliveryEventAsync(CreateDeliveryEventDto dto);
    Task<DeliveryEvent?> GetDeliveryEventByIdAsync(string id);
    Task<List<DeliveryEvent>> GetDeliveryEventsByDeliveryIdAsync(string deliveryId);
    Task<List<DeliveryEvent>> GetDeliveryEventsByOrderIdAsync(string orderId);
    Task<List<DeliveryEvent>> GetAllDeliveryEventsAsync();
    Task<DeliveryEvent?> GetLatestEventByDeliveryIdAsync(string deliveryId);
}