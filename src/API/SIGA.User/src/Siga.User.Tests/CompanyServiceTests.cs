using MongoDB.Bson;
using Moq;
using SIGA.User.Application.Services;
using SIGA.User.Domain.DTOs;
using SIGA.User.Domain.Interfaces;
using SIGA.User.Domain.Models;
using Xunit;

namespace SIGA.User.Tests.Application.Services;

public class CompanyServiceTests
{
    private readonly Mock<ICompanyRepository> _mockRepository;
    private readonly CompanyService _service;

    public CompanyServiceTests()
    {
        _mockRepository = new Mock<ICompanyRepository>();
        _service = new CompanyService(_mockRepository.Object);
    }

    #region GetAllAsync

    [Fact]
    public async Task GetAllAsync_ReturnsAllCompanies()
    {
        var companies = new List<Company>
        {
            new Company
            {
                Id = ObjectId.GenerateNewId(),
                Name = "Company 1",
                Cnpj = "12345678000190",
                Phone = "1133334444",
                Address = new Address
                {
                    Street = "Rua A",
                    Number = "123",
                    City = "São Paulo",
                    State = "SP"
                },
                CreatedAt = DateTime.UtcNow
            },
            new Company
            {
                Id = ObjectId.GenerateNewId(),
                Name = "Company 2",
                Cnpj = "98765432000170",
                Phone = "1144445555",
                Address = new Address
                {
                    Street = "Rua B",
                    Number = "456",
                    City = "Rio de Janeiro",
                    State = "RJ"
                },
                CreatedAt = DateTime.UtcNow
            }
        };

        _mockRepository.Setup(r => r.GetAllAsync())
            .ReturnsAsync(companies);

        var result = await _service.GetAllAsync();

        Assert.NotNull(result);
        Assert.Equal(2, result.Count());
        Assert.Contains(result, c => c.Name == "Company 1");
        Assert.Contains(result, c => c.Name == "Company 2");
    }

    [Fact]
    public async Task GetAllAsync_WithNoCompanies_ReturnsEmptyList()
    {
        _mockRepository.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Company>());

        var result = await _service.GetAllAsync();

        Assert.NotNull(result);
        Assert.Empty(result);
    }

    #endregion

    #region GetByIdAsync

    [Fact]
    public async Task GetByIdAsync_WithValidId_ReturnsCompanyDto()
    {
        var companyId = ObjectId.GenerateNewId();
        var company = new Company
        {
            Id = companyId,
            Name = "Company Test",
            Cnpj = "12345678000190",
            Phone = "1133334444",
            Address = new Address
            {
                Street = "Rua A",
                Number = "123",
                City = "São Paulo",
                State = "SP"
            },
            CreatedAt = DateTime.UtcNow
        };

        _mockRepository.Setup(r => r.GetByIdAsync(companyId))
            .ReturnsAsync(company);

        var result = await _service.GetByIdAsync(companyId.ToString());

        Assert.NotNull(result);
        Assert.Equal("Company Test", result.Name);
        Assert.Equal("12345678000190", result.Cnpj);
        Assert.Equal("1133334444", result.Phone);
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
        var companyId = ObjectId.GenerateNewId();

        _mockRepository.Setup(r => r.GetByIdAsync(companyId))
            .ReturnsAsync((Company?)null);

        var result = await _service.GetByIdAsync(companyId.ToString());

        Assert.Null(result);
    }

    #endregion

    #region GetByCnpjAsync

    [Fact]
    public async Task GetByCnpjAsync_WithValidCnpj_ReturnsCompanyDto()
    {
        var cnpj = "12345678000190";
        var company = new Company
        {
            Id = ObjectId.GenerateNewId(),
            Name = "Company Test",
            Cnpj = cnpj,
            Phone = "1133334444",
            CreatedAt = DateTime.UtcNow
        };

        _mockRepository.Setup(r => r.GetByCnpjAsync(cnpj))
            .ReturnsAsync(company);

        var result = await _service.GetByCnpjAsync(cnpj);

        Assert.NotNull(result);
        Assert.Equal(cnpj, result.Cnpj);
        Assert.Equal("Company Test", result.Name);
    }

    [Fact]
    public async Task GetByCnpjAsync_WithNonExistentCnpj_ReturnsNull()
    {
        var cnpj = "12345678000190";

        _mockRepository.Setup(r => r.GetByCnpjAsync(cnpj))
            .ReturnsAsync((Company?)null);

        var result = await _service.GetByCnpjAsync(cnpj);

        Assert.Null(result);
    }

    #endregion

    #region CreateAsync

    [Fact]
    public async Task CreateAsync_WithValidData_CreatesCompany()
    {
        var dto = new CreateCompanyDto
        {
            Name = "New Company",
            Cnpj = "12345678000190",
            Phone = "1133334444",
            Address = new AddressDto
            {
                Street = "Rua A",
                Number = "123",
                Neighborhood = "Centro",
                City = "São Paulo",
                State = "SP",
                PostalCode = "01310-100"
            }
        };

        _mockRepository.Setup(r => r.CreateAsync(It.IsAny<Company>()))
            .ReturnsAsync((Company company) => new Company
            {
                Id = company.Id,
                Name = company.Name,
                Cnpj = company.Cnpj,
                Phone = company.Phone,
                Address = company.Address,
                CreatedAt = company.CreatedAt
            });

        var result = await _service.CreateAsync(dto);

        Assert.NotNull(result);
        Assert.Equal("New Company", result.Name);
        Assert.Equal("12345678000190", result.Cnpj);
        Assert.Equal("1133334444", result.Phone);
        Assert.NotNull(result.Address);
        Assert.Equal("Rua A", result.Address.Street);
    }

    #endregion

    #region UpdateAsync

    [Fact]
    public async Task UpdateAsync_WithValidId_UpdatesCompany()
    {
        var companyId = ObjectId.GenerateNewId();
        var existingCompany = new Company
        {
            Id = companyId,
            Name = "Old Company",
            Cnpj = "12345678000190",
            Phone = "1133334444",
            CreatedAt = DateTime.UtcNow
        };

        var dto = new UpdateCompanyDto
        {
            Name = "Updated Company"
        };

        _mockRepository.Setup(r => r.GetByIdAsync(companyId))
            .ReturnsAsync(existingCompany);

        _mockRepository.Setup(r => r.UpdateAsync(companyId, It.IsAny<Company>()))
            .ReturnsAsync((ObjectId _, Company company) => company);

        var result = await _service.UpdateAsync(companyId.ToString(), dto);

        Assert.NotNull(result);
        Assert.Equal("Updated Company", result.Name);
    }

    [Fact]
    public async Task UpdateAsync_WithInvalidId_ReturnsNull()
    {
        var dto = new UpdateCompanyDto { Name = "Test" };

        var result = await _service.UpdateAsync("invalid-id", dto);

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_WithNonExistentId_ReturnsNull()
    {
        var companyId = ObjectId.GenerateNewId();
        var dto = new UpdateCompanyDto { Name = "Test" };

        _mockRepository.Setup(r => r.GetByIdAsync(companyId))
            .ReturnsAsync((Company?)null);

        var result = await _service.UpdateAsync(companyId.ToString(), dto);

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_KeepsExistingValuesWhenNotProvided()
    {
        var companyId = ObjectId.GenerateNewId();
        var existingCompany = new Company
        {
            Id = companyId,
            Name = "Original Name",
            Cnpj = "12345678000190",
            Phone = "1133334444",
            Address = new Address
            {
                Street = "Rua Original",
                Number = "123"
            },
            CreatedAt = DateTime.UtcNow
        };

        var dto = new UpdateCompanyDto
        {
            Name = null,
            Cnpj = null,
            Phone = "9999999999",
            Address = null
        };

        _mockRepository.Setup(r => r.GetByIdAsync(companyId))
            .ReturnsAsync(existingCompany);

        _mockRepository.Setup(r => r.UpdateAsync(companyId, It.IsAny<Company>()))
            .ReturnsAsync((ObjectId _, Company company) => company);

        var result = await _service.UpdateAsync(companyId.ToString(), dto);

        Assert.NotNull(result);
        Assert.Equal("Original Name", result.Name);
        Assert.Equal("12345678000190", result.Cnpj);
        Assert.Equal("9999999999", result.Phone);
    }

    #endregion

    #region DeleteAsync

    [Fact]
    public async Task DeleteAsync_WithValidId_DeletesCompany()
    {
        var companyId = ObjectId.GenerateNewId();

        _mockRepository.Setup(r => r.DeleteAsync(companyId))
            .ReturnsAsync(true);

        var result = await _service.DeleteAsync(companyId.ToString());

        Assert.True(result);
        _mockRepository.Verify(r => r.DeleteAsync(companyId), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WithInvalidId_ReturnsFalse()
    {
        var result = await _service.DeleteAsync("invalid-id");

        Assert.False(result);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<ObjectId>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_WithNonExistentId_ReturnsFalse()
    {
        var companyId = ObjectId.GenerateNewId();

        _mockRepository.Setup(r => r.DeleteAsync(companyId))
            .ReturnsAsync(false);

        var result = await _service.DeleteAsync(companyId.ToString());

        Assert.False(result);
    }

    #endregion
}
