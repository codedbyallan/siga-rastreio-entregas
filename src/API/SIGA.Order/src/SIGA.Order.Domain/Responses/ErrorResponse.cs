using System.Text.Json.Serialization;

namespace SIGA.Order.Domain.Responses;

public sealed record ErrorResponse(string? EntityId, string ErrorMessage, string? ErrorCode)
{
    public ErrorResponse(string message) : this(null, message, null) { }

    [JsonConstructor]
    public ErrorResponse(string entityId, string message) : this(entityId, message, null) { }
};

public sealed record ErrorsResponse(string EntityId, List<string> ErrorMessage, string? ErrorCode)
{
    public ErrorsResponse(string entityId, List<string> message) : this(entityId, message, null) { }
};
