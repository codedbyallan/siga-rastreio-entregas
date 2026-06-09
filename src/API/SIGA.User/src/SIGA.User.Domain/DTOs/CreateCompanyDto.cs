namespace SIGA.User.Domain.DTOs
{
    public class CreateCompanyDto
    {
        public string Name { get; set; } = string.Empty;
        public string Cnpj { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public AddressDto Address { get; set; } = new AddressDto();
    }
}