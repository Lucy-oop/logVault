using Blogfox.Api.Data;
using Blogfox.Api.Dtos.Posts;
using Blogfox.Api.Entities;
using Blogfox.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blogfox.Api.Controllers;

public record AuthorProfile(
    Guid Id,
    string DisplayName,
    string Handle,
    DateTime JoinedAt,
    int PostCount,
    int TotalViews,
    int TotalReactions,
    int TotalComments,
    IReadOnlyList<PostListItem> Posts
);

[ApiController]
[Route("api/authors")]
public class AuthorsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AuthorsController(AppDbContext db) => _db = db;

    [HttpGet("{handle}")]
    public async Task<ActionResult<AuthorProfile>> GetByHandle(string handle)
    {
        // Match any user whose slugified display name matches the handle
        var users = await _db.Users
            .Select(u => new { u.Id, u.DisplayName, u.CreatedAt })
            .ToListAsync();

        var match = users.FirstOrDefault(u => SlugGenerator.Slugify(u.DisplayName) == handle.ToLowerInvariant());
        if (match is null) return NotFound();

        var posts = await _db.Posts
            .Where(p => p.AuthorId == match.Id && p.Status == PostStatus.Published)
            .Include(p => p.Author)
            .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
            .OrderByDescending(p => p.PublishedAt ?? p.UpdatedAt)
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

        return Ok(new AuthorProfile(
            match.Id,
            match.DisplayName,
            handle.ToLowerInvariant(),
            match.CreatedAt,
            posts.Count,
            posts.Sum(p => p.ViewCount),
            posts.Sum(p => p.ReactionCount),
            posts.Sum(p => p.CommentCount),
            posts
        ));
    }
}
