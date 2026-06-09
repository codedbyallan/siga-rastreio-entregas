namespace SIGA.User.Domain.Responses;

public sealed record DataResponse<T>(T Data, bool Success, List<ErrorResponse>? Errors = null);

public sealed record DataResponse(bool Success, List<ErrorResponse>? Errors = null);
