using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Text;
using System.Text.Json;

namespace SIGA.Gateway.API;

public class ProxyService : IProxyService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ProxyService> _logger;
    private readonly ResilienceConfig _config;
    private readonly CircuitBreakerState _circuitBreakerState;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ProxyService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<ProxyService> logger,
        IHttpContextAccessor httpContextAccessor)
    {
        _httpClient = httpClient;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;

        _config = new ResilienceConfig
        {
            TimeoutSeconds = configuration.GetValue<int>("HttpClientPolicy:TimeoutSeconds", 30),
            RetryCount = configuration.GetValue<int>("HttpClientPolicy:RetryCount", 3),
            CircuitBreakerThreshold = configuration.GetValue<int>("HttpClientPolicy:CircuitBreakerThreshold", 5),
            CircuitBreakerTimeoutSeconds = configuration.GetValue<int>("HttpClientPolicy:CircuitBreakerTimeoutSeconds", 30)
        };

        _httpClient.Timeout = TimeSpan.FromSeconds(_config.TimeoutSeconds);
        _circuitBreakerState = new CircuitBreakerState(
            _config.CircuitBreakerThreshold,
            _config.CircuitBreakerTimeoutSeconds);
    }

    public async Task<IActionResult> ForwardAsync(
        string? serviceUrl,
        string endpoint,
        HttpMethod method,
        object? body = null)
    {
        if (string.IsNullOrWhiteSpace(serviceUrl))
        {
            return new ObjectResult(new
            {
                error = "URL do serviço não configurada no Gateway."
            })
            {
                StatusCode = StatusCodes.Status500InternalServerError
            };
        }

        _circuitBreakerState.CheckCircuitBreakerTimeout();

        var url = BuildUrl(serviceUrl, endpoint);

        if (_circuitBreakerState.IsOpen)
        {
            _logger.LogError("Circuit breaker está ABERTO. Rejeitando requisição {Method} para {Url}", method, url);

            return new ObjectResult(new
            {
                error = "Serviço temporariamente indisponível.",
                message = "Circuit breaker aberto no Gateway."
            })
            {
                StatusCode = StatusCodes.Status503ServiceUnavailable
            };
        }

        Exception? lastException = null;

        for (var attempt = 1; attempt <= _config.RetryCount; attempt++)
        {
            try
            {
                _logger.LogInformation(
                    "[{Method}] Tentativa {Attempt}/{RetryCount} para {Url}",
                    method,
                    attempt,
                    _config.RetryCount,
                    url);

                using var request = CreateRequest(url, method, body);
                using var response = await _httpClient.SendAsync(request);
                var responseContent = await response.Content.ReadAsStringAsync();
                var statusCode = (int)response.StatusCode;

                LogResponse(method.Method, url, response.StatusCode, responseContent);

                if (response.IsSuccessStatusCode)
                {
                    _circuitBreakerState.RecordSuccess();
                    return BuildActionResult(response, responseContent);
                }

                if (IsClientError(response.StatusCode))
                {
                    return BuildActionResult(response, responseContent);
                }

                _circuitBreakerState.RecordFailure();

                if (attempt == _config.RetryCount)
                {
                    return BuildActionResult(response, responseContent);
                }

                var delayInSeconds = Math.Pow(2, attempt - 1);

                _logger.LogInformation(
                    "Aguardando {Delay}s antes de tentar novamente {Method} {Url}",
                    delayInSeconds,
                    method,
                    url);

                await Task.Delay(TimeSpan.FromSeconds(delayInSeconds));
            }
            catch (TaskCanceledException ex)
            {
                lastException = ex;
                _circuitBreakerState.RecordFailure();

                _logger.LogWarning(
                    ex,
                    "Timeout na tentativa {Attempt}/{RetryCount} para {Method} {Url}",
                    attempt,
                    _config.RetryCount,
                    method,
                    url);

                if (attempt == _config.RetryCount)
                {
                    return new ObjectResult(new
                    {
                        error = "Timeout ao chamar serviço interno.",
                        message = ex.Message
                    })
                    {
                        StatusCode = StatusCodes.Status504GatewayTimeout
                    };
                }

                var delayInSeconds = Math.Pow(2, attempt - 1);
                await Task.Delay(TimeSpan.FromSeconds(delayInSeconds));
            }
            catch (HttpRequestException ex)
            {
                lastException = ex;
                _circuitBreakerState.RecordFailure();

                _logger.LogWarning(
                    ex,
                    "Erro HTTP na tentativa {Attempt}/{RetryCount} para {Method} {Url}",
                    attempt,
                    _config.RetryCount,
                    method,
                    url);

                if (attempt == _config.RetryCount)
                {
                    return new ObjectResult(new
                    {
                        error = "Erro ao chamar serviço interno.",
                        message = ex.Message
                    })
                    {
                        StatusCode = StatusCodes.Status503ServiceUnavailable
                    };
                }

                var delayInSeconds = Math.Pow(2, attempt - 1);
                await Task.Delay(TimeSpan.FromSeconds(delayInSeconds));
            }
            catch (Exception ex)
            {
                lastException = ex;
                _circuitBreakerState.RecordFailure();

                _logger.LogError(
                    ex,
                    "Erro inesperado ao encaminhar {Method} para {Url}",
                    method,
                    url);

                return new ObjectResult(new
                {
                    error = "Erro inesperado no Gateway.",
                    message = ex.Message
                })
                {
                    StatusCode = StatusCodes.Status500InternalServerError
                };
            }
        }

        return new ObjectResult(new
        {
            error = "Falha ao chamar serviço interno.",
            message = lastException?.Message
        })
        {
            StatusCode = StatusCodes.Status503ServiceUnavailable
        };
    }

    private HttpRequestMessage CreateRequest(
        string url,
        HttpMethod method,
        object? body)
    {
        var request = new HttpRequestMessage(method, url);

        AddAuthorizationHeader(request);

        if (body != null && method != HttpMethod.Get && method != HttpMethod.Delete)
        {
            var jsonContent = JsonSerializer.Serialize(body);
            request.Content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
        }

        return request;
    }

    private void AddAuthorizationHeader(HttpRequestMessage request)
    {
        var authHeader = _httpContextAccessor.HttpContext?.Request.Headers.Authorization.ToString();

        if (!string.IsNullOrWhiteSpace(authHeader))
        {
            request.Headers.TryAddWithoutValidation("Authorization", authHeader);
        }
    }

    private static string BuildUrl(string serviceUrl, string endpoint)
    {
        return $"{serviceUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";
    }

    private static bool IsClientError(HttpStatusCode statusCode)
    {
        var numericStatusCode = (int)statusCode;
        return numericStatusCode >= 400 && numericStatusCode < 500;
    }

    private IActionResult BuildActionResult(HttpResponseMessage response, string responseContent)
    {
        var statusCode = (int)response.StatusCode;

        if (string.IsNullOrWhiteSpace(responseContent))
        {
            return new StatusCodeResult(statusCode);
        }

        var contentType =
            response.Content.Headers.ContentType?.ToString() ??
            "application/json";

        return new ContentResult
        {
            StatusCode = statusCode,
            Content = responseContent,
            ContentType = contentType
        };
    }

    private void LogResponse(
        string method,
        string url,
        HttpStatusCode statusCode,
        string responseContent)
    {
        var preview = string.IsNullOrWhiteSpace(responseContent)
            ? "(vazio)"
            : responseContent.Substring(0, Math.Min(500, responseContent.Length));

        if ((int)statusCode >= 200 && (int)statusCode < 300)
        {
            _logger.LogInformation(
                "[{Method}] Resposta {StatusCode} de {Url}. Conteúdo: {Content}",
                method,
                statusCode,
                url,
                preview);

            return;
        }

        _logger.LogWarning(
            "[{Method}] Resposta não bem-sucedida {StatusCode} de {Url}. Conteúdo: {Content}",
            method,
            statusCode,
            url,
            preview);
    }
}

internal class CircuitBreakerState
{
    private int _failureCount = 0;
    private DateTime _circuitBreakerOpenedTime = DateTime.MinValue;
    private readonly int _failureThreshold;
    private readonly int _timeoutSeconds;
    private readonly object _lock = new object();

    public bool IsOpen { get; private set; } = false;

    public CircuitBreakerState(int failureThreshold, int timeoutSeconds)
    {
        _failureThreshold = failureThreshold;
        _timeoutSeconds = timeoutSeconds;
    }

    public void RecordFailure()
    {
        lock (_lock)
        {
            _failureCount++;

            if (_failureCount >= _failureThreshold && !IsOpen)
            {
                IsOpen = true;
                _circuitBreakerOpenedTime = DateTime.UtcNow;
            }
        }
    }

    public void RecordSuccess()
    {
        lock (_lock)
        {
            _failureCount = 0;
            IsOpen = false;
            _circuitBreakerOpenedTime = DateTime.MinValue;
        }
    }

    public void CheckCircuitBreakerTimeout()
    {
        lock (_lock)
        {
            if (IsOpen &&
                DateTime.UtcNow.Subtract(_circuitBreakerOpenedTime).TotalSeconds > _timeoutSeconds)
            {
                IsOpen = false;
                _failureCount = 0;
                _circuitBreakerOpenedTime = DateTime.MinValue;
            }
        }
    }
}

internal class ResilienceConfig
{
    public int TimeoutSeconds { get; set; }
    public int RetryCount { get; set; }
    public int CircuitBreakerThreshold { get; set; }
    public int CircuitBreakerTimeoutSeconds { get; set; }
}