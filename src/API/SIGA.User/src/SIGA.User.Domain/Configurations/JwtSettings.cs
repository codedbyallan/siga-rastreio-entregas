namespace SIGA.User.Domain.Configurations;

/// <summary>
/// Configurações para JWT
/// </summary>
public class JwtSettings
{
    public string SecretKey { get; set; }
    public string Issuer { get; set; }
    public string Audience { get; set; }
    public int ExpirationMinutes { get; set; }
}
