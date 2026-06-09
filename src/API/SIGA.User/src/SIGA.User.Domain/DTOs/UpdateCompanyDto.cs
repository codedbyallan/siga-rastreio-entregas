namespace SIGA.User.Domain.DTOs
{
    public class UpdateCompanyDto
    {
        public string? Name { get; set; }
        public string? Cnpj { get; set; }
        public string? Phone { get; set; }
        public AddressDto? Address { get; set; }
    }
}