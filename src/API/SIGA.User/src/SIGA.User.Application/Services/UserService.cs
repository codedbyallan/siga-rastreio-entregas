using MongoDB.Bson;
using SIGA.User.Domain.DTOs;
using SIGA.User.Domain.Interfaces;
using SIGA.User.Domain.Interfaces.Services;

namespace SIGA.User.Application.Services;

public class UserService : IUserService
{
    private static readonly string[] AllowedRoles =
    {
        "admin",
        "company_operator",
        "courier"
    };

    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<UserDto?> GetByIdAsync(string id)
    {
        if (!ObjectId.TryParse(id, out var objectId))
        {
            return null;
        }

        var user = await _userRepository.GetByIdAsync(objectId);
        return user != null ? MapToDto(user) : null;
    }

    public async Task<UserDto?> GetByEmailAsync(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        var user = await _userRepository.GetByEmailAsync(email.Trim().ToLowerInvariant());
        return user != null ? MapToDto(user) : null;
    }

    public async Task<IEnumerable<UserDto>> GetAllAsync()
    {
        var users = await _userRepository.GetAllAsync();
        return users.Select(MapToDto);
    }

    public async Task<IEnumerable<UserDto>> GetCouriersAsync()
    {
        var users = await _userRepository.GetByRoleAsync("courier");
        return users.Select(MapToDto);
    }

    public async Task<IEnumerable<UserDto>> GetCouriersByCompanyIdAsync(string companyId)
    {
        if (string.IsNullOrWhiteSpace(companyId))
        {
            throw new ArgumentException("CompanyId é obrigatório.");
        }

        var users = await _userRepository.GetByRoleAndCompanyIdAsync("courier", companyId.Trim());
        return users.Select(MapToDto);
    }

    public async Task<UserDto> CreateAsync(CreateUserDto dto)
    {
        ValidateCreateUserDto(dto);

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var normalizedRole = NormalizeRole(dto.Role);

        var existingUser = await _userRepository.GetByEmailAsync(normalizedEmail);

        if (existingUser != null)
        {
            throw new InvalidOperationException("Já existe um usuário cadastrado com este e-mail.");
        }

        var user = new Domain.Models.User
        {
            Id = ObjectId.GenerateNewId(),
            Name = dto.Name.Trim(),
            Email = normalizedEmail,
            Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Phone = dto.Phone?.Trim() ?? string.Empty,
            Role = normalizedRole,
            CompanyId = string.IsNullOrWhiteSpace(dto.CompanyId) ? null : dto.CompanyId.Trim(),
            CreatedAt = DateTime.UtcNow,
            Address = dto.Address?.ToModel()
        };

        var createdUser = await _userRepository.CreateAsync(user);
        return MapToDto(createdUser);
    }

    public async Task<UserDto?> UpdateAsync(string id, UpdateUserDto dto)
    {
        if (!ObjectId.TryParse(id, out var objectId))
        {
            return null;
        }

        ValidateUpdateUserDto(dto);

        var existingUser = await _userRepository.GetByIdAsync(objectId);

        if (existingUser == null)
        {
            return null;
        }

        if (dto.Name != null)
        {
            existingUser.Name = dto.Name.Trim();
        }

        if (dto.Email != null)
        {
            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

            if (!string.Equals(existingUser.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase))
            {
                var userWithSameEmail = await _userRepository.GetByEmailAsync(normalizedEmail);

                if (userWithSameEmail != null && userWithSameEmail.Id != existingUser.Id)
                {
                    throw new InvalidOperationException("Já existe um usuário cadastrado com este e-mail.");
                }
            }

            existingUser.Email = normalizedEmail;
        }

        if (dto.Password != null)
        {
            existingUser.Password = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        }

        if (dto.Phone != null)
        {
            existingUser.Phone = dto.Phone.Trim();
        }

        if (dto.Role != null)
        {
            existingUser.Role = NormalizeRole(dto.Role);
        }

        if (dto.CompanyId != null)
        {
            existingUser.CompanyId = string.IsNullOrWhiteSpace(dto.CompanyId)
                ? null
                : dto.CompanyId.Trim();
        }

        existingUser.UpdatedAt = DateTime.UtcNow;

        if (dto.Address != null)
        {
            existingUser.Address = dto.Address.ToModel();
        }

        ValidateCompanyRequirement(existingUser.Role, existingUser.CompanyId);

        var updatedUser = await _userRepository.UpdateAsync(objectId, existingUser);
        return updatedUser != null ? MapToDto(updatedUser) : null;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        if (!ObjectId.TryParse(id, out var objectId))
        {
            return false;
        }

        return await _userRepository.DeleteAsync(objectId);
    }

    private static void ValidateCreateUserDto(CreateUserDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentException("Dados do usuário são obrigatórios.");
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new ArgumentException("Nome é obrigatório.");
        }

        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            throw new ArgumentException("E-mail é obrigatório.");
        }

        if (string.IsNullOrWhiteSpace(dto.Password))
        {
            throw new ArgumentException("Senha é obrigatória.");
        }

        var normalizedRole = NormalizeRole(dto.Role);

        ValidateRole(normalizedRole);
        ValidateCompanyRequirement(normalizedRole, dto.CompanyId);
    }

    private static void ValidateUpdateUserDto(UpdateUserDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentException("Dados de atualização do usuário são obrigatórios.");
        }

        if (dto.Name != null && string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new ArgumentException("Nome não pode ser vazio.");
        }

        if (dto.Email != null && string.IsNullOrWhiteSpace(dto.Email))
        {
            throw new ArgumentException("E-mail não pode ser vazio.");
        }

        if (dto.Password != null && string.IsNullOrWhiteSpace(dto.Password))
        {
            throw new ArgumentException("Senha não pode ser vazia.");
        }

        if (dto.Role != null)
        {
            var normalizedRole = NormalizeRole(dto.Role);
            ValidateRole(normalizedRole);
        }
    }

    private static string NormalizeRole(string? role)
    {
        if (string.IsNullOrWhiteSpace(role))
        {
            return "company_operator";
        }

        var normalizedRole = role.Trim().ToLowerInvariant();

        return normalizedRole switch
        {
            "client" => "company_operator",
            "customer" => "company_operator",
            "operator" => "company_operator",
            "companyoperator" => "company_operator",
            "company_operator" => "company_operator",
            "admin" => "admin",
            "courier" => "courier",
            "entregador" => "courier",
            _ => normalizedRole
        };
    }

    private static void ValidateRole(string role)
    {
        if (!AllowedRoles.Contains(role))
        {
            throw new ArgumentException($"Role inválida: {role}.");
        }
    }

    private static void ValidateCompanyRequirement(string role, string? companyId)
    {
        if (
            (role == "company_operator" || role == "courier")
            && string.IsNullOrWhiteSpace(companyId)
        )
        {
            throw new ArgumentException($"CompanyId é obrigatório para usuário do tipo {role}.");
        }
    }

    private static UserDto MapToDto(Domain.Models.User user)
    {
        return new UserDto
        {
            Id = user.Id.ToString(),
            Name = user.Name,
            Email = user.Email,
            Password = user.Password,
            Phone = user.Phone,
            Role = NormalizeRole(user.Role),
            CompanyId = user.CompanyId,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            Address = user.Address?.ToDto()
        };
    }
}