using MongoDB.Bson;
using SIGA.User.Domain.DTOs;
using SIGA.User.Domain.Interfaces;
using SIGA.User.Domain.Interfaces.Services;
using SIGA.User.Domain.Models;

namespace SIGA.User.Application.Services
{
    public class CompanyService : ICompanyService
    {
        private readonly ICompanyRepository _companyRepository;

        public CompanyService(ICompanyRepository companyRepository)
        {
            _companyRepository = companyRepository;
        }

        public async Task<IEnumerable<CompanyDto>> GetAllAsync()
        {
            var companies = await _companyRepository.GetAllAsync();
            return companies.Select(MapToDto);
        }

        public async Task<CompanyDto?> GetByIdAsync(string id)
        {
            if (!ObjectId.TryParse(id, out var objectId))
            {
                return null;
            }

            var company = await _companyRepository.GetByIdAsync(objectId);
            return company != null ? MapToDto(company) : null;
        }

        public async Task<CompanyDto?> GetByCnpjAsync(string cnpj)
        {
            var company = await _companyRepository.GetByCnpjAsync(cnpj);
            return company != null ? MapToDto(company) : null;
        }

        public async Task<CompanyDto> CreateAsync(CreateCompanyDto dto)
        {
            var company = new Company
            {
                Name = dto.Name,
                Cnpj = dto.Cnpj,
                Phone = dto.Phone,
                Address = MapToModel(dto.Address)
            };

            var created = await _companyRepository.CreateAsync(company);
            return MapToDto(created);
        }

        public async Task<CompanyDto?> UpdateAsync(string id, UpdateCompanyDto dto)
        {
            if (!ObjectId.TryParse(id, out var objectId))
            {
                return null;
            }

            var existing = await _companyRepository.GetByIdAsync(objectId);

            if (existing == null)
            {
                return null;
            }

            existing.Name = dto.Name ?? existing.Name;
            existing.Cnpj = dto.Cnpj ?? existing.Cnpj;
            existing.Phone = dto.Phone ?? existing.Phone;
            existing.Address = dto.Address != null
                ? MapToModel(dto.Address)
                : existing.Address;

            var updated = await _companyRepository.UpdateAsync(objectId, existing);
            return updated != null ? MapToDto(updated) : null;
        }

        public async Task<bool> DeleteAsync(string id)
        {
            if (!ObjectId.TryParse(id, out var objectId))
            {
                return false;
            }

            return await _companyRepository.DeleteAsync(objectId);
        }

        private static CompanyDto MapToDto(Company company)
        {
            return new CompanyDto
            {
                Id = company.Id.ToString(),
                Name = company.Name,
                Cnpj = company.Cnpj,
                Phone = company.Phone,
                Address = MapToDto(company.Address),
                CreatedAt = company.CreatedAt
            };
        }

        private static Address MapToModel(AddressDto dto)
        {
            return new Address
            {
                Street = dto.Street,
                Number = dto.Number,
                Neighborhood = dto.Neighborhood,
                City = dto.City,
                State = dto.State,
                PostalCode = dto.PostalCode
            };
        }

        private static AddressDto MapToDto(Address address)
        {
            return new AddressDto
            {
                Street = address.Street,
                Number = address.Number,
                Neighborhood = address.Neighborhood,
                City = address.City,
                State = address.State,
                PostalCode = address.PostalCode
            };
        }
    }
}