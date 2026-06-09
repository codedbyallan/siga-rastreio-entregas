using MongoDB.Bson;

namespace SIGA.Delivery.Domain.Models;

public class Delivery
{
    public ObjectId Id { get; set; }
    public string OrderId { get; set; }

    public string? CourierId { get; set; }

    public Address Address { get; set; }
    public Address? OriginAddress { get; set; }

    public string? TrackingCode { get; set; }
    public string? Carrier { get; set; }
    public DateTime? PostingDate { get; set; }

    public string Status { get; set; }
    public DateTime? EstimatedDeliveryDate { get; set; }
    public DateTime CreatedAt { get; set; }
}