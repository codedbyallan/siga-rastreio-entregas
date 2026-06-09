namespace SIGA.Delivery.Domain.DTOs;

public class CreateDeliveryDto
{
    public string OrderId { get; set; } = string.Empty;

    public string? CourierId { get; set; }

    public AddressDto Address { get; set; } = new();
    public AddressDto? OriginAddress { get; set; }

    public string? TrackingCode { get; set; }
    public string? Carrier { get; set; }
    public DateTime? PostingDate { get; set; }

    public string Status { get; set; } = string.Empty;
    public DateTime? EstimatedDeliveryDate { get; set; }
}

public class UpdateDeliveryDto
{
    public string? OrderId { get; set; }

    public string? CourierId { get; set; }

    public AddressDto? Address { get; set; }
    public AddressDto? OriginAddress { get; set; }

    public string? TrackingCode { get; set; }
    public string? Carrier { get; set; }
    public DateTime? PostingDate { get; set; }

    public string? Status { get; set; }
    public DateTime? EstimatedDeliveryDate { get; set; }
}

public class AssignCourierDto
{
    public string CourierId { get; set; } = string.Empty;
}

public class DeliveryDto
{
    public string Id { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;

    public string? CourierId { get; set; }

    public AddressDto Address { get; set; } = new();
    public AddressDto? OriginAddress { get; set; }

    public string? TrackingCode { get; set; }
    public string? Carrier { get; set; }
    public DateTime? PostingDate { get; set; }

    public string Status { get; set; } = string.Empty;
    public DateTime? EstimatedDeliveryDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DeliveryTrackingDto
{
    public DeliveryDto Delivery { get; set; } = new();
    public List<DeliveryTrackingEventDto> Events { get; set; } = new();
}

public class DeliveryTrackingEventDto
{
    public string? Id { get; set; }
    public string DeliveryId { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DeliveryTrackingActorDto? Actor { get; set; }
}
public class DeliveryTrackingActorDto
{
    public string Type { get; set; } = string.Empty;
    public string Id { get; set; } = string.Empty;
}