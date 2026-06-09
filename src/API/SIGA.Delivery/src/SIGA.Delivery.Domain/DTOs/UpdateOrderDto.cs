namespace SIGA.Delivery.Domain.DTOs;

public class UpdateOrderDto
{
    public string? UserId { get; set; }
    public string? CompanyId { get; set; }
    public decimal? TotalPrice { get; set; }
    public string? Status { get; set; }
    public List<OrderItemDto>? Items { get; set; }
}

public class OrderItemDto
{
    public string? Name { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}
