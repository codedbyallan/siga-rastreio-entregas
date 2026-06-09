using System;

namespace SIGA.User.Domain.Configurations;

public record MongoDbSettings
{
    public const string SectionName = "MongoDbSettings";
    public string Host { get; set; } = string.Empty;
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}