using System.Security.Claims;
using Blogfox.Api.Data;
using Blogfox.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blogfox.Api.Controllers;

public record AdminUserItem(
    Guid Id,
    string Email,
    string DisplayName,
    string Role,
    bool IsBanned,
    DateTime CreatedAt,
    int PostCount,
    int CommentCount
);

public record AdminStats(
    int TotalUsers,
    int BannedUsers,
    int Admins,
    int TotalPosts,
    int HiddenPosts,
    int TotalComments,
    int TotalReactions,
    int OpenReports
);

public record AdminPostItem(
    Guid Id,
    string Slug,
    string Title,
    string AuthorName,
    Guid AuthorId,
    string Status,
    DateTime? PublishedAt,
    DateTime UpdatedAt,
    int ViewCount,
    int ReactionCount,
    int CommentCount,
    string? CoverImageUrl
);

public record AdminReportItem(
    Guid Id,
    string ReporterName,
    string Reason,
    string Details,
    string Status,
    DateTime CreatedAt,
    Guid PostId,
    string PostSlug,
    string PostTitle,
    string PostAuthorName,
    string PostStatus
);

[ApiController]
[Route("api/admin")]
[Authorize(Roles = nameof(UserRole.Admin))]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db) => _db = db;

    [HttpGet("stats")]
    public async Task<ActionResult<AdminStats>> Stats()
    {
        var totalUsers = await _db.Users.CountAsync();
        var bannedUsers = await _db.Users.CountAsync(u => u.IsBanned);
        var admins = await _db.Users.CountAsync(u => u.Role == UserRole.Admin);
        var totalPosts = await _db.Posts.CountAsync(p => p.Status == PostStatus.Published);
        var hiddenPosts = await _db.Posts.CountAsync(p => p.Status == PostStatus.Hidden);
        var totalComments = await _db.Comments.CountAsync(c => c.Status == CommentStatus.Approved);
        var totalReactions = await _db.PostReactions.CountAsync();
        var openReports = await _db.Reports.CountAsync(r => r.Status == ReportStatus.Open);
        return Ok(new AdminStats(totalUsers, bannedUsers, admins, totalPosts, hiddenPosts, totalComments, totalReactions, openReports));
    }

    [HttpGet("reports")]
    public async Task<ActionResult<IReadOnlyList<AdminReportItem>>> Reports([FromQuery] string? status)
    {
        IQueryable<Report> q = _db.Reports.Include(r => r.Reporter).Include(r => r.Post).ThenInclude(p => p.Author);

        if (string.IsNullOrWhiteSpace(status))
        {
            q = q.Where(r => r.Status == ReportStatus.Open);
        }
        else if (Enum.TryParse<ReportStatus>(status, true, out var s))
        {
            q = q.Where(r => r.Status == s);
        }

        var items = await q
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new AdminReportItem(
                r.Id,
                r.Reporter != null ? r.Reporter.DisplayName : "(deleted user)",
                r.Reason.ToString(),
                r.Details,
                r.Status.ToString(),
                r.CreatedAt,
                r.PostId,
                r.Post.Slug,
                r.Post.Title,
                r.Post.Author.DisplayName,
                r.Post.Status.ToString()))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost("reports/{id:guid}/resolve")]
    public async Task<IActionResult> ResolveReport(Guid id, [FromQuery] bool hide = false)
    {
        var report = await _db.Reports.Include(r => r.Post).FirstOrDefaultAsync(r => r.Id == id);
        if (report is null) return NotFound();

        var me = CurrentUserId();
        report.Status = ReportStatus.Resolved;
        report.ResolvedById = me;
        report.ResolvedAt = DateTime.UtcNow;

        if (hide && report.Post.Status != PostStatus.Hidden)
        {
            report.Post.Status = PostStatus.Hidden;
            report.Post.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("reports/{id:guid}/dismiss")]
    public async Task<IActionResult> DismissReport(Guid id)
    {
        var report = await _db.Reports.FindAsync(id);
        if (report is null) return NotFound();
        var me = CurrentUserId();
        report.Status = ReportStatus.Dismissed;
        report.ResolvedById = me;
        report.ResolvedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("posts")]
    public async Task<ActionResult<IReadOnlyList<AdminPostItem>>> Posts(
        [FromQuery] string? search,
        [FromQuery] string? status)
    {
        IQueryable<Post> q = _db.Posts.Include(p => p.Author);

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<PostStatus>(status, true, out var s))
        {
            q = q.Where(p => p.Status == s);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = $"%{search.Trim()}%";
            q = q.Where(p =>
                EF.Functions.ILike(p.Title, term) ||
                EF.Functions.ILike(p.Author.DisplayName, term));
        }

        var items = await q
            .OrderByDescending(p => p.PublishedAt ?? p.UpdatedAt)
            .Select(p => new AdminPostItem(
                p.Id,
                p.Slug,
                p.Title,
                p.Author.DisplayName,
                p.AuthorId,
                p.Status.ToString(),
                p.PublishedAt,
                p.UpdatedAt,
                p.ViewCount,
                _db.PostReactions.Count(r => r.PostId == p.Id),
                _db.Comments.Count(c => c.PostId == p.Id && c.Status == CommentStatus.Approved),
                p.CoverImageUrl))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost("posts/{id:guid}/hide")]
    public async Task<IActionResult> HidePost(Guid id)
    {
        var post = await _db.Posts.FindAsync(id);
        if (post is null) return NotFound();
        post.Status = PostStatus.Hidden;
        post.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("posts/{id:guid}/restore")]
    public async Task<IActionResult> RestorePost(Guid id)
    {
        var post = await _db.Posts.FindAsync(id);
        if (post is null) return NotFound();
        post.Status = PostStatus.Published;
        if (post.PublishedAt is null) post.PublishedAt = DateTime.UtcNow;
        post.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("users")]
    public async Task<ActionResult<IReadOnlyList<AdminUserItem>>> Users([FromQuery] string? search)
    {
        IQueryable<User> q = _db.Users;
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = $"%{search.Trim()}%";
            q = q.Where(u => EF.Functions.ILike(u.Email, s) || EF.Functions.ILike(u.DisplayName, s));
        }

        var users = await q
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new AdminUserItem(
                u.Id,
                u.Email,
                u.DisplayName,
                u.Role.ToString(),
                u.IsBanned,
                u.CreatedAt,
                _db.Posts.Count(p => p.AuthorId == u.Id),
                _db.Comments.Count(c => c.AuthorId == u.Id)
            ))
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost("users/{id:guid}/ban")]
    public async Task<IActionResult> Ban(Guid id)
    {
        var target = await _db.Users.FindAsync(id);
        if (target is null) return NotFound();

        var me = CurrentUserId();
        if (target.Id == me) return BadRequest(new { message = "You cannot ban yourself." });
        if (target.Role == UserRole.Admin) return BadRequest(new { message = "Cannot ban another admin." });

        target.IsBanned = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("users/{id:guid}/unban")]
    public async Task<IActionResult> Unban(Guid id)
    {
        var target = await _db.Users.FindAsync(id);
        if (target is null) return NotFound();
        target.IsBanned = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("users/{id:guid}/promote")]
    public async Task<IActionResult> Promote(Guid id)
    {
        var target = await _db.Users.FindAsync(id);
        if (target is null) return NotFound();
        target.Role = UserRole.Admin;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("users/{id:guid}/demote")]
    public async Task<IActionResult> Demote(Guid id)
    {
        var target = await _db.Users.FindAsync(id);
        if (target is null) return NotFound();

        var me = CurrentUserId();
        if (target.Id == me) return BadRequest(new { message = "You cannot demote yourself." });

        target.Role = UserRole.Author;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private Guid? CurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
