using System.Security.Claims;
using Blogfox.Api.Data;
using Blogfox.Api.Dtos.Posts;
using Blogfox.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blogfox.Api.Controllers;

[ApiController]
public class BookmarksController : ControllerBase
{
    private readonly AppDbContext _db;

    public BookmarksController(AppDbContext db) => _db = db;

    [HttpGet("api/me/bookmarks")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<PostListItem>>> List()
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var items = await _db.Posts
            .Where(p => p.Status == PostStatus.Published &&
                        _db.Bookmarks.Any(b => b.PostId == p.Id && b.UserId == userId))
            .Include(p => p.Author)
            .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
            .OrderByDescending(p =>
                _db.Bookmarks
                    .Where(b => b.PostId == p.Id && b.UserId == userId)
                    .Select(b => b.CreatedAt)
                    .FirstOrDefault())
            .Select(p => new PostListItem(
                p.Id, p.Slug, p.Title, p.Excerpt, p.CoverImageUrl,
                p.Status.ToString(), p.PublishedAt, p.UpdatedAt,
                p.Author.DisplayName,
                p.ViewCount,
                p.WordCount,
                _db.PostReactions.Count(r => r.PostId == p.Id),
                _db.Comments.Count(c => c.PostId == p.Id && c.Status == CommentStatus.Approved),
                p.PostTags.Select(pt => pt.Tag.Name).ToList()))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("api/posts/{slug}/bookmark")]
    [Authorize]
    public async Task<ActionResult<object>> Get(string slug)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var postId = await _db.Posts
            .Where(p => p.Slug == slug && p.Status == PostStatus.Published)
            .Select(p => (Guid?)p.Id)
            .FirstOrDefaultAsync();
        if (postId is null) return NotFound();

        var exists = await _db.Bookmarks.AnyAsync(b => b.UserId == userId && b.PostId == postId);
        return Ok(new { bookmarked = exists });
    }

    [HttpPost("api/posts/{slug}/bookmark")]
    [Authorize]
    public async Task<IActionResult> Add(string slug)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var postId = await _db.Posts
            .Where(p => p.Slug == slug && p.Status == PostStatus.Published)
            .Select(p => (Guid?)p.Id)
            .FirstOrDefaultAsync();
        if (postId is null) return NotFound();

        var exists = await _db.Bookmarks.AnyAsync(b => b.UserId == userId && b.PostId == postId);
        if (!exists)
        {
            _db.Bookmarks.Add(new Bookmark
            {
                UserId = userId.Value,
                PostId = postId.Value,
                CreatedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync();
        }
        return Ok(new { bookmarked = true });
    }

    [HttpDelete("api/posts/{slug}/bookmark")]
    [Authorize]
    public async Task<IActionResult> Remove(string slug)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var postId = await _db.Posts
            .Where(p => p.Slug == slug)
            .Select(p => (Guid?)p.Id)
            .FirstOrDefaultAsync();
        if (postId is null) return NotFound();

        var existing = await _db.Bookmarks
            .FirstOrDefaultAsync(b => b.UserId == userId && b.PostId == postId);
        if (existing is not null)
        {
            _db.Bookmarks.Remove(existing);
            await _db.SaveChangesAsync();
        }
        return Ok(new { bookmarked = false });
    }

    private Guid? CurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
