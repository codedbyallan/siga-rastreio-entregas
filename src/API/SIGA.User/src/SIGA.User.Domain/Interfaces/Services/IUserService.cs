using SIGA.User.Domain.DTOs;

namespace SIGA.User.Domain.Interfaces.Services;

public interface IUserService
{
    Task<UserDto?> GetByIdAsync(string id);
    Task<UserDto?> GetByEmailAsync(string email);
    Task<IEnumerable<UserDto>> GetAllAsync();
    Task<IEnumerable<UserDto>> GetCouriersAsync();
    Task<IEnumerable<UserDto>> GetCouriersByCompanyIdAsync(string companyId);
    Task<UserDto> CreateAsync(CreateUserDto dto);
    Task<UserDto?> UpdateAsync(string id, UpdateUserDto dto);
    Task<bool> DeleteAsync(string id);
}