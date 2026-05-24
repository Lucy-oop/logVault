using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blogfox.Api.Controllers;

[ApiController]
[Route("api/uploads")]
[Authorize]
public class UploadsController : ControllerBase
{
    private const long MaxBytes = 5 * 1024 * 1024;
    private static readonly Dictionary<string, string> AllowedTypes = new()
    {
        { "image/jpeg", ".jpg" },
        { "image/png", ".png" },
        { "image/webp", ".webp" },
        { "image/gif", ".gif" },
    };

    private readonly IWebHostEnvironment _env;

    public UploadsController(IWebHostEnvironment env) => _env = env;

    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxBytes + 1024)]
    public async Task<ActionResult<object>> Upload(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file provided." });

        if (file.Length > MaxBytes)
            return BadRequest(new { message = $"File too large (max {MaxBytes / (1024 * 1024)} MB)." });

        var contentType = (file.ContentType ?? "").ToLowerInvariant();
        if (!AllowedTypes.TryGetValue(contentType, out var ext))
            return BadRequest(new { message = "Unsupported file type. Use JPEG, PNG, WebP, or GIF." });

        var webRoot = string.IsNullOrEmpty(_env.WebRootPath)
            ? Path.Combine(_env.ContentRootPath, "wwwroot")
            : _env.WebRootPath;
        var uploadsDir = Path.Combine(webRoot, "uploads");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(uploadsDir, fileName);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(stream);
        }

        return Ok(new
        {
            url = $"/uploads/{fileName}",
            contentType,
            sizeBytes = file.Length,
        });
    }
}
