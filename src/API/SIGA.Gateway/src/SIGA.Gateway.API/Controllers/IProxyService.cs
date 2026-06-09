using Microsoft.AspNetCore.Mvc;

namespace SIGA.Gateway.API;

public interface IProxyService
{
    Task<IActionResult> ForwardAsync(
        string? serviceUrl,
        string endpoint,
        HttpMethod method,
        object? body = null);
}