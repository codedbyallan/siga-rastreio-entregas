namespace SIGA.Delivery.Domain.Models;

public class Order
{
    public string? Id { get; set; }
    public string CompanyId { get; set; } = string.Empty;
    public string CustomerId { get; set; } = string.Empty;
    public string DeliveryId { get; set; } = string.Empty;
    public List<OrderItem> Items { get; set; } = new List<OrderItem>();
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}