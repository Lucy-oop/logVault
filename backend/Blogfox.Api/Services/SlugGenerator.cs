using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Blogfox.Api.Services;

public static class SlugGenerator
{
    public static string Slugify(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;

        var normalized = input.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }

        var ascii = sb.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
        ascii = Regex.Replace(ascii, @"[^a-z0-9\s-]", "");
        ascii = Regex.Replace(ascii, @"\s+", "-").Trim('-');
        ascii = Regex.Replace(ascii, "-{2,}", "-");

        return ascii.Length > 80 ? ascii[..80].TrimEnd('-') : ascii;
    }
}
