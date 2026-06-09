using System.Text.RegularExpressions;

namespace SIGA.Order.Api.Helpers;

public class SlugifyParameterTransformer : IOutboundParameterTransformer
{
    public string TransformOutbound(object value)
    {
        return value == null ? null : Regex.Replace(value.ToString(), "(?<=.)([A-Z])", "-$1").ToLower();
    }
}
