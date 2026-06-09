using System;
using System.Collections.Generic;

namespace SIGA.Order.Domain.DTOs;

public class CreateOrderDto
{
    public string UserId { get; set; } = string.Empty;
    public string CompanyId { get; set; } = string.Empty;
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = "CREATED";
    public List<OrderItemDto> Items { get; set; } = new();
}

public class UpdateOrderDto
{
    public string? UserId { get; set; }
    public string? CompanyId { get; set; }
    public decimal? TotalPrice { get; set; }
    public string? Status { get; set; }
    public List<OrderItemDto>? Items { get; set; }
}

public class OrderDto
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string CompanyId { get; set; } = string.Empty;
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<OrderItemDto> Items { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class OrderItemDto
{
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}