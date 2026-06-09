using SIGA.User.Domain.DTOs;
using SIGA.User.Domain.Models;

namespace SIGA.User.Application.Services;

/// <summary>
/// Mapper para conversão entre AddressDto e Address
/// </summary>
public static class AddressMapper
{
    /// <summary>
    /// Converte AddressDto para Address (DTO → Model)
    /// </summary>
    public static Address ToModel(this AddressDto dto)
    {
        if (dto == null)
            return null;

        return new Address
        {
            Street = dto.Street,
            City = dto.City,
            State = dto.State,
            PostalCode = dto.PostalCode
        };
    }

    /// <summary>
    /// Converte Address para AddressDto (Model → DTO)
    /// </summary>
    public static AddressDto ToDto(this Address model)
    {
        if (model == null)
            return null;

        return new AddressDto
        {
            Street = model.Street,
            City = model.City,
            State = model.State,
            PostalCode = model.PostalCode
        };
    }
}
