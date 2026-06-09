namespace SIGA.Delivery.Domain.DTOs;

public class ApiDataResponseDto<T>
{
    public T? Data { get; set; }
    public bool Success { get; set; }
}