using SIGA.User.Domain.DTOs;

namespace SIGA.User.Domain.Interfaces.Services
{
    public interface ICompanyService
    {
        Task<IEnumerable<CompanyDto>> GetAllAsync();
        Task<CompanyDto?> GetByIdAsync(string id);
        Task<CompanyDto?> GetByCnpjAsync(string cnpj);
        Task<CompanyDto?> CreateAsync(CreateCompanyDto dto);
        Task<CompanyDto?> UpdateAsync(string id, UpdateCompanyDto dto);
        Task<bool> DeleteAsync(string id);

    }
}
