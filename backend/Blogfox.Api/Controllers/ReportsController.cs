using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Blogfox.Api.Data;
using Blogfox.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blogfox.Api.Controllers;

public record CreateReportRequest(
    [Required] Guid PostId,
    [Required] string Reason,
    string? Details
);

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReportsController(AppDbContext db) => _db = db;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReportRequest req)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        if (!Enum.TryParse<ReportReason>(req.Reason, true, out var reason))
            return BadRequest(new { message = "Invalid reason." });

        var post = await _db.Posts.FindAsync(req.PostId);
        if (post is null) return NotFound(new { message = "Post not found." });

        // Block duplicate open reports from the same user on the same post.
        var existing = await _db.Reports.AnyAsync(r =>
            r.ReporterId == userId &&
            r.PostId == req.PostId &&
            r.Status == ReportStatus.Open);
        if (existing)
            return Conflict(new { message = "You already reported this post. We're looking into it." });

        var details = (req.Details ?? string.Empty).Trim();
        if (details.Length > 500) details = details[..500];

        _db.Reports.Add(new Report
        {
            ReporterId = userId,
            PostId = req.PostId,
            Reason = reason,
            Details = details,
            Status = ReportStatus.Open,
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();

        return Ok(new { message = "Thanks — an admin will review this shortly." });
    }

    private Guid? CurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
