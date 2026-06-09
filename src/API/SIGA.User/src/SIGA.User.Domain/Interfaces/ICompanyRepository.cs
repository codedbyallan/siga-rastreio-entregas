using System;                        // Para tipos base (DateTime, etc.)
using System.Collections.Generic;    // Para IEnumerable
using System.Threading.Tasks;        // Para Task
using MongoDB.Bson;                  // Para ObjectId
using SIGA.User.Domain.Models;       // Para Company

namespace SIGA.User.Domain.Interfaces
{
    public interface ICompanyRepository
    {
        Task<Company?> GetByIdAsync(ObjectId id);
        Task<Company?> GetByCnpjAsync(string cnpj);
        Task<IEnumerable<Company>> GetAllAsync();
        Task<Company> CreateAsync(Company company);
        Task<Company?> UpdateAsync(ObjectId id, Company company);
        Task<bool> DeleteAsync(ObjectId id);
        Task<bool> ExistsAsync(ObjectId id);
    }
}