namespace SIGA.Order.Domain.Configurations;

public record MongoDbSettings
{
    public const string SectionName = "MongoDbSettings";
    public string Host { get; set; }
    public string DatabaseName { get; set; }
    public string Username { get; set; }
    public string Password { get; set; }
}
