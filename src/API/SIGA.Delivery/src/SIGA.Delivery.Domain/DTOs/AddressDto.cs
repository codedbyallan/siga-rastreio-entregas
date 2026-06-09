namespace SIGA.Delivery.Domain.DTOs
{
    public class AddressDto
    {
        public string Street { get; set; } = string.Empty;
        public string? Number { get; set; }
        public string? Neighborhood { get; set; }
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
    }
}