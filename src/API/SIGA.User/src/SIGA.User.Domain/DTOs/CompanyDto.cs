namespace SIGA.User.Domain.DTOs
{
    public class CompanyDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Cnpj { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public AddressDto Address { get; set; } = new AddressDto();
        public DateTime CreatedAt { get; set; }
    }
}