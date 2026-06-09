using MongoDB.Bson;
using System.Collections.Generic;

namespace SIGA.Order.Domain.Models;

public class Order
{
    public ObjectId Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string CompanyId { get; set; } = string.Empty;
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<OrderItem> Items { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class OrderItem
{
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}