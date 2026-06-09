using System.Net;

namespace SIGA.Order.Domain.Exceptions;

[Serializable]
public class BaseException(HttpStatusCode status, string? message) : Exception(message)
{
    public HttpStatusCode StatusCode { get; set; } = status;
    public override string Message => base.Message;
}
