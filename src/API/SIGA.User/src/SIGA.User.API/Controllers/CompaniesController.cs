using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGA.User.Domain.DTOs;
using SIGA.User.Domain.Interfaces.Services;
using SIGA.User.Domain.Responses;
using System.Security.Claims;

namespace SIGA.User.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CompaniesController : ControllerBase
{
    private readonly ICompanyService _companyService;

    public CompaniesController(ICompanyService companyService)
    {
        _companyService = companyService;
    }

    [Authorize]
    [HttpGet]
    [ProducesResponseType(typeof(DataResponse<IEnumerable<CompanyDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        if (!IsAdmin())
        {
            return Forbid();
        }

        var companies = await _companyService.GetAllAsync();
        return Ok(new DataResponse<IEnumerable<CompanyDto>>(companies, true));
    }

    [Authorize]
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(DataResponse<CompanyDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(string id)
    {
        if (!IsAdmin() && GetCurrentCompanyId() != id)
        {
            return Forbid();
        }

        var company = await _companyService.GetByIdAsync(id);

        if (company == null)
        {
            return NotFound(new DataResponse(false, new List<ErrorResponse>
            {
                new("Company not found")
            }));
        }

        return Ok(new DataResponse<CompanyDto>(company, true));
    }

    [AllowAnonymous]
    [HttpGet("cnpj/{cnpj}")]
    [ProducesResponseType(typeof(DataResponse<CompanyDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByCnpj(string cnpj)
    {
        var company = await _companyService.GetByCnpjAsync(cnpj);

        if (company == null)
        {
            return NotFound(new DataResponse(false, new List<ErrorResponse>
            {
                new("Company not found")
            }));
        }

        return Ok(new DataResponse<CompanyDto>(company, true));
    }

    [AllowAnonymous]
    [HttpPost]
    [ProducesResponseType(typeof(DataResponse<CompanyDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateCompanyDto dto)
    {
        var company = await _companyService.CreateAsync(dto);

        return CreatedAtAction(
            nameof(GetById),
            new { id = company.Id },
            new DataResponse<CompanyDto>(company, true)
        );
    }

    [Authorize]
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(DataResponse<CompanyDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateCompanyDto dto)
    {
        if (!IsAdmin())
        {
            return Forbid();
        }

        var company = await _companyService.UpdateAsync(id, dto);

        if (company == null)
        {
            return NotFound(new DataResponse(false, new List<ErrorResponse>
            {
                new("Company not found")
            }));
        }

        return Ok(new DataResponse<CompanyDto>(company, true));
    }

    [Authorize]
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DataResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        if (!IsAdmin())
        {
            return Forbid();
        }

        var success = await _companyService.DeleteAsync(id);

        if (!success)
        {
            return NotFound(new DataResponse(false, new List<ErrorResponse>
            {
                new("Company not found")
            }));
        }

        return Ok(new DataResponse(true));
    }

    private string? GetCurrentCompanyId()
    {
        return User.FindFirst("companyId")?.Value;
    }

    private string GetCurrentRole()
    {
        return (
            User.FindFirst(ClaimTypes.Role)?.Value
            ?? User.FindFirst("role")?.Value
            ?? string.Empty
        ).Trim().ToLowerInvariant();
    }

    private bool IsAdmin()
    {
        return GetCurrentRole() == "admin";
    }
}