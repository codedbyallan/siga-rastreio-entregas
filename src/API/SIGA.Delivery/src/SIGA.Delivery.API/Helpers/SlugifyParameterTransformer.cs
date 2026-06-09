using System.Text.RegularExpressions;

namespace SIGA.Delivery.Api.Helpers
{
    public class SlugifyParameterTransformer : IOutboundParameterTransformer
    {
        public string TransformOutbound(object value)
        {
            // Slugify value
            return value == null ? null : Regex.Replace(value.ToString(), "(?<=.)([A-Z])", "-$1").ToLower();
        }
    }
}
