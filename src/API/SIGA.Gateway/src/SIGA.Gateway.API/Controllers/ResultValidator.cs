using System.Text.Json;

namespace SIGA.Gateway.API.Controllers;

public static class ResultValidator
{
    public static bool IsNullOrEmpty(dynamic result)
    {
        try
        {
            if (result == null)
                return true;

            if (result is JsonElement jsonElement)
            {
                return jsonElement.ValueKind == JsonValueKind.Null ||
                       jsonElement.ValueKind == JsonValueKind.Undefined;
            }

            return false;
        }
        catch
        {
            return result == null;
        }
    }
}
