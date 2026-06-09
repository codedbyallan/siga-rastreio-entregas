using SIGA.Delivery.Domain.Models;

namespace SIGA.Delivery.Domain.DTOs;

public class CreateDeliveryEventDto
{
    public string DeliveryId { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public Actor Actor { get; set; } = new Actor();
}