using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Refit;
using SIGA.Delivery.Domain.Exceptions;
using SIGA.Delivery.Domain.Responses;
using System.ComponentModel.DataAnnotations;
using System.Net;

namespace SIGA.Delivery.Api.Handlers;

public class ExceptionHandler(RequestDelegate next, ILogger<ExceptionHandler> logger)
{
    public async Task Invoke(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ApiException error)
        {
            await HandleExceptionAsync(context, error);
        }
        catch (Exception error)
        {
            await HandleExceptionAsync(context, error);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception error)
    {
        var response = context.Response;
        response.ContentType = "application/json";

        switch (error)
        {
            case BaseException:
                var newException = (BaseException)error;
                response.StatusCode = (int)newException.StatusCode;
                break;
            case ValidationException:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                break;
            default:
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                break;
        }

        var format = new JsonSerializerSettings
        {
            ContractResolver = new CamelCasePropertyNamesContractResolver(),
            NullValueHandling = NullValueHandling.Ignore,
        };

        var listErrors = new List<ErrorResponse>
    {
        new(error?.Message)
    };

        var result = JsonConvert.SerializeObject(new DataResponse<object>(null, false, listErrors), format);
        await response.WriteAsync(result);

        logger.LogError(error, result);
    }

    private async Task HandleExceptionAsync(HttpContext context, ApiException error)
    {
        var response = context.Response;
        response.ContentType = "application/json";

        response.StatusCode = (int)HttpStatusCode.BadRequest;

        var format = new JsonSerializerSettings
        {
            ContractResolver = new CamelCasePropertyNamesContractResolver()
        };
        var errors = new List<ErrorResponse>
    {
        new($"{error.Message} - Endpoint: {error.Uri}")
    };

        var result = JsonConvert.SerializeObject(new DataResponse<object>(JsonConvert.DeserializeObject(error.Content), false, errors), format);

        await response.WriteAsync(result);

        logger.LogError(error, result);
    }
}
