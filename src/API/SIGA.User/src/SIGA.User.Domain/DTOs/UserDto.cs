using Newtonsoft.Json;

namespace SIGA.User.Domain.DTOs;

public class CreateUserDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Role { get; set; }
    public string? CompanyId { get; set; }
    public AddressDto? Address { get; set; }
}

public class UpdateUserDto
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string? Phone { get; set; }
    public string? Role { get; set; }
    public string? CompanyId { get; set; }
    public AddressDto? Address { get; set; }
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    [JsonIgnore]
    public string Password { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? CompanyId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public AddressDto? Address { get; set; }
}