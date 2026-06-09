using MongoDB.Bson;
using Moq;
using SIGA.User.Application.Services;
using SIGA.User.Domain.DTOs;
using SIGA.User.Domain.Interfaces;
using SIGA.User.Domain.Models;
using Xunit;

namespace SIGA.User.Tests.Application.Services;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _mockRepository;
    private readonly UserService _service;

    public UserServiceTests()
    {
        _mockRepository = new Mock<IUserRepository>();
        _service = new UserService(_mockRepository.Object);
    }

    #region GetByIdAsync

    [Fact]
    public async Task GetByIdAsync_WithValidId_ReturnsUserDto()
    {
        var userId = ObjectId.GenerateNewId();
        var user = new Domain.Models.User
        {
            Id = userId,
            Name = "João Silva",
            Email = "joao@example.com",
            Password = BCrypt.Net.BCrypt.HashPassword("password123"),
            Phone = "11999999999",
            Role = "company_operator",
            CompanyId = "company123",
            CreatedAt = DateTime.UtcNow
        };

        _mockRepository.Setup(r => r.GetByIdAsync(userId))
            .ReturnsAsync(user);

        var result = await _service.GetByIdAsync(userId.ToString());

        Assert.NotNull(result);
        Assert.Equal("João Silva", result.Name);
        Assert.Equal("joao@example.com", result.Email);
        Assert.Equal("company_operator", result.Role);
    }

    [Fact]
    public async Task GetByIdAsync_WithInvalidId_ReturnsNull()
    {
        var result = await _service.GetByIdAsync("invalid-id");

        Assert.Null(result);
        _mockRepository.Verify(r => r.GetByIdAsync(It.IsAny<ObjectId>()), Times.Never);
    }

    [Fact]
    public async Task GetByIdAsync_WithNonExistentId_ReturnsNull()
    {
        var userId = ObjectId.GenerateNewId();

        _mockRepository.Setup(r => r.GetByIdAsync(userId))
            .ReturnsAsync((Domain.Models.User?)null);

        var result = await _service.GetByIdAsync(userId.ToString());

        Assert.Null(result);
    }

    #endregion

    #region GetByEmailAsync

    [Fact]
    public async Task GetByEmailAsync_WithValidEmail_ReturnsUserDto()
    {
        var user = new Domain.Models.User
        {
            Id = ObjectId.GenerateNewId(),
            Name = "João Silva",
            Email = "joao@example.com",
            Password = BCrypt.Net.BCrypt.HashPassword("password123"),
            Phone = "11999999999",
            Role = "admin",
            CreatedAt = DateTime.UtcNow
        };

        _mockRepository.Setup(r => r.GetByEmailAsync("joao@example.com"))
            .ReturnsAsync(user);

        var result = await _service.GetByEmailAsync("joao@example.com");

        Assert.NotNull(result);
        Assert.Equal("João Silva", result.Name);
        Assert.Equal("joao@example.com", result.Email);
    }

    [Fact]
    public async Task GetByEmailAsync_WithNullEmail_ReturnsNull()
    {
        var result = await _service.GetByEmailAsync(null!);

        Assert.Null(result);
        _mockRepository.Verify(r => r.GetByEmailAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task GetByEmailAsync_WithWhitespaceEmail_ReturnsNull()
    {
        var result = await _service.GetByEmailAsync("   ");

        Assert.Null(result);
        _mockRepository.Verify(r => r.GetByEmailAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task GetByEmailAsync_NormalizesEmailToLowercase()
    {
        var user = new Domain.Models.User
        {
            Id = ObjectId.GenerateNewId(),
            Name = "João Silva",
            Email = "joao@example.com",
            Password = BCrypt.Net.BCrypt.HashPassword("password123"),
            Phone = "11999999999",
            Role = "admin",
            CreatedAt = DateTime.UtcNow
        };

        _mockRepository.Setup(r => r.GetByEmailAsync("joao@example.com"))
            .ReturnsAsync(user);

        var result = await _service.GetByEmailAsync("JOAO@EXAMPLE.COM");

        Assert.NotNull(result);
        _mockRepository.Verify(r => r.GetByEmailAsync("joao@example.com"), Times.Once);
    }

    #endregion

    #region GetAllAsync

    [Fact]
    public async Task GetAllAsync_ReturnsAllUsers()
    {
        var users = new List<Domain.Models.User>
        {
            new Domain.Models.User
            {
                Id = ObjectId.GenerateNewId(),
                Name = "User 1",
                Email = "user1@example.com",
                Password = BCrypt.Net.BCrypt.HashPassword("pass1"),
                Role = "admin",
                CreatedAt = DateTime.UtcNow
            },
            new Domain.Models.User
            {
                Id = ObjectId.GenerateNewId(),
                Name = "User 2",
                Email = "user2@example.com",
                Password = BCrypt.Net.BCrypt.HashPassword("pass2"),
                Role = "courier",
                CompanyId = "company1",
                CreatedAt = DateTime.UtcNow
            }
        };

        _mockRepository.Setup(r => r.GetAllAsync())
            .ReturnsAsync(users);

        var result = await _service.GetAllAsync();

        Assert.NotNull(result);
        Assert.Equal(2, result.Count());
    }

    #endregion

    #region CreateAsync

    [Fact]
    public async Task CreateAsync_WithValidData_CreatesUser()
    {
        var dto = new CreateUserDto
        {
            Name = "João Silva",
            Email = "joao@example.com",
            Password = "password123",
            Phone = "11999999999",
            Role = "company_operator",
            CompanyId = "company123"
        };

        _mockRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((Domain.Models.User?)null);

        _mockRepository.Setup(r => r.CreateAsync(It.IsAny<Domain.Models.User>()))
            .ReturnsAsync((Domain.Models.User user) => new Domain.Models.User
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Password = user.Password,
                Phone = user.Phone,
                Role = user.Role,
                CompanyId = user.CompanyId,
                CreatedAt = user.CreatedAt,
                Address = user.Address
            });

        var result = await _service.CreateAsync(dto);

        Assert.NotNull(result);
        Assert.Equal("João Silva", result.Name);
        Assert.Equal("joao@example.com", result.Email);
        Assert.Equal("company_operator", result.Role);
    }

    [Fact]
    public async Task CreateAsync_WithDuplicateEmail_ThrowsException()
    {
        var existingUser = new Domain.Models.User
        {
            Id = ObjectId.GenerateNewId(),
            Name = "Existing",
            Email = "joao@example.com",
            Password = BCrypt.Net.BCrypt.HashPassword("pass"),
            Role = "admin",
            CreatedAt = DateTime.UtcNow
        };

        var dto = new CreateUserDto
        {
            Name = "João Silva",
            Email = "joao@example.com",
            Password = "password123",
            Phone = "11999999999",
            Role = "admin"
        };

        _mockRepository.Setup(r => r.GetByEmailAsync("joao@example.com"))
            .ReturnsAsync(existingUser);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.CreateAsync(dto));

        Assert.Contains("já existe", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateAsync_WithNullName_ThrowsException()
    {
        var dto = new CreateUserDto
        {
            Name = null!,
            Email = "joao@example.com",
            Password = "password123",
            Role = "admin"
        };

        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.CreateAsync(dto));

        Assert.Contains("Nome", exception.Message);
    }

    [Fact]
    public async Task CreateAsync_WithInvalidRole_ThrowsException()
    {
        var dto = new CreateUserDto
        {
            Name = "João Silva",
            Email = "joao@example.com",
            Password = "password123",
            Role = "invalid_role"
        };

        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.CreateAsync(dto));

        Assert.Contains("Role", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateAsync_CourierWithoutCompanyId_ThrowsException()
    {
        var dto = new CreateUserDto
        {
            Name = "João Silva",
            Email = "joao@example.com",
            Password = "password123",
            Role = "courier",
            CompanyId = null
        };

        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.CreateAsync(dto));

        Assert.Contains("CompanyId", exception.Message);
    }

    [Fact]
    public async Task CreateAsync_NormalizeRole_ClientToCompanyOperator()
    {
        var dto = new CreateUserDto
        {
            Name = "João Silva",
            Email = "joao@example.com",
            Password = "password123",
            Role = "client",
            CompanyId = "company123"
        };

        _mockRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((Domain.Models.User?)null);

        _mockRepository.Setup(r => r.CreateAsync(It.IsAny<Domain.Models.User>()))
            .ReturnsAsync((Domain.Models.User user) => user);

        var result = await _service.CreateAsync(dto);

        Assert.Equal("company_operator", result.Role);
    }

    [Fact]
    public async Task CreateAsync_NormalizeEmailToLowercase()
    {
        var dto = new CreateUserDto
        {
            Name = "João Silva",
            Email = "JOAO@EXAMPLE.COM",
            Password = "password123",
            Role = "admin"
        };

        _mockRepository.Setup(r => r.GetByEmailAsync("joao@example.com"))
            .ReturnsAsync((Domain.Models.User?)null);

        _mockRepository.Setup(r => r.CreateAsync(It.IsAny<Domain.Models.User>()))
            .ReturnsAsync((Domain.Models.User user) => user);

        var result = await _service.CreateAsync(dto);

        Assert.Equal("joao@example.com", result.Email);
    }

    #endregion

    #region UpdateAsync

    [Fact]
    public async Task UpdateAsync_WithValidId_UpdatesUser()
    {
        var userId = ObjectId.GenerateNewId();
        var existingUser = new Domain.Models.User
        {
            Id = userId,
            Name = "João Silva",
            Email = "joao@example.com",
            Password = BCrypt.Net.BCrypt.HashPassword("password123"),
            Phone = "11999999999",
            Role = "company_operator",
            CompanyId = "company123",
            CreatedAt = DateTime.UtcNow
        };

        var dto = new UpdateUserDto
        {
            Name = "João Silva Updated"
        };

        _mockRepository.Setup(r => r.GetByIdAsync(userId))
            .ReturnsAsync(existingUser);

        _mockRepository.Setup(r => r.UpdateAsync(userId, It.IsAny<Domain.Models.User>()))
            .ReturnsAsync((ObjectId _, Domain.Models.User user) => user);

        var result = await _service.UpdateAsync(userId.ToString(), dto);

        Assert.NotNull(result);
        Assert.Equal("João Silva Updated", result.Name);
    }

    [Fact]
    public async Task UpdateAsync_WithInvalidId_ReturnsNull()
    {
        var dto = new UpdateUserDto { Name = "Test" };

        var result = await _service.UpdateAsync("invalid-id", dto);

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_WithNonExistentId_ReturnsNull()
    {
        var userId = ObjectId.GenerateNewId();
        var dto = new UpdateUserDto { Name = "Test" };

        _mockRepository.Setup(r => r.GetByIdAsync(userId))
            .ReturnsAsync((Domain.Models.User?)null);

        var result = await _service.UpdateAsync(userId.ToString(), dto);

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_WithEmptyName_ThrowsException()
    {
        var userId = ObjectId.GenerateNewId();
        var dto = new UpdateUserDto { Name = "   " };

        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.UpdateAsync(userId.ToString(), dto));

        Assert.Contains("Nome", exception.Message);
    }

    #endregion

    #region DeleteAsync

    [Fact]
    public async Task DeleteAsync_WithValidId_DeletesUser()
    {
        var userId = ObjectId.GenerateNewId();

        _mockRepository.Setup(r => r.DeleteAsync(userId))
            .ReturnsAsync(true);

        var result = await _service.DeleteAsync(userId.ToString());

        Assert.True(result);
        _mockRepository.Verify(r => r.DeleteAsync(userId), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WithInvalidId_ReturnsFalse()
    {
        var result = await _service.DeleteAsync("invalid-id");

        Assert.False(result);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<ObjectId>()), Times.Never);
    }

    #endregion

    #region GetCouriersAsync

    [Fact]
    public async Task GetCouriersAsync_ReturnsCouriers()
    {
        var couriers = new List<Domain.Models.User>
        {
            new Domain.Models.User
            {
                Id = ObjectId.GenerateNewId(),
                Name = "Courier 1",
                Email = "courier1@example.com",
                Password = BCrypt.Net.BCrypt.HashPassword("pass"),
                Role = "courier",
                CompanyId = "company1",
                CreatedAt = DateTime.UtcNow
            }
        };

        _mockRepository.Setup(r => r.GetByRoleAsync("courier"))
            .ReturnsAsync(couriers);

        var result = await _service.GetCouriersAsync();

        Assert.Single(result);
        Assert.All(result, user => Assert.Equal("courier", user.Role));
    }

    #endregion

    #region GetCouriersByCompanyIdAsync

    [Fact]
    public async Task GetCouriersByCompanyIdAsync_WithValidCompanyId_ReturnsCouriers()
    {
        var companyId = "company123";
        var couriers = new List<Domain.Models.User>
        {
            new Domain.Models.User
            {
                Id = ObjectId.GenerateNewId(),
                Name = "Courier 1",
                Email = "courier1@example.com",
                Password = BCrypt.Net.BCrypt.HashPassword("pass"),
                Role = "courier",
                CompanyId = companyId,
                CreatedAt = DateTime.UtcNow
            }
        };

        _mockRepository.Setup(r => r.GetByRoleAndCompanyIdAsync("courier", companyId))
            .ReturnsAsync(couriers);

        var result = await _service.GetCouriersByCompanyIdAsync(companyId);

        Assert.Single(result);
        Assert.All(result, user => Assert.Equal(companyId, user.CompanyId));
    }

    [Fact]
    public async Task GetCouriersByCompanyIdAsync_WithNullCompanyId_ThrowsException()
    {
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.GetCouriersByCompanyIdAsync(null!));

        Assert.Contains("CompanyId", exception.Message);
    }

    #endregion
}
