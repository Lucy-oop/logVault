using Blogfox.Api.Data;
using Blogfox.Api.Dtos.Posts;
using Blogfox.Api.Dtos.Tags;
using Blogfox.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blogfox.Api.Controllers;

[ApiController]
[Route("api/tags")]
public class TagsController : ControllerBase
{
    private readonly AppDbContext _db;

    public TagsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TagResponse>>> List()
    {
        var tags = await _db.Tags
            .OrderBy(t => t.Name)
            .Select(t => new TagResponse(
                t.Id,
                t.Slug,
                t.Name,
                t.PostTags.Count(pt => pt.Post.Status == PostStatus.Published)))
            .ToListAsync();
        return Ok(tags);
    }

    [HttpGet("{slug}/related")]
    public async Task<ActionResult<IReadOnlyList<PostListItem>>> Related(string slug)
    {
        var tagSlug = slug.Trim().ToLowerInvariant();
        var tagId = await _db.Tags
            .Where(t => t.Slug == tagSlug)
            .Select(t => (Guid?)t.Id)
            .FirstOrDefaultAsync();
        if (tagId is null) return NotFound();

        var siblingTagIds = await _db.PostTags
            .Where(pt => pt.Post.Status == PostStatus.Published &&
                         pt.Post.PostTags.Any(p2 => p2.TagId == tagId) &&
                         pt.TagId != tagId)
            .Select(pt => pt.TagId)
            .Distinct()
            .ToListAsync();

        var items = await _db.Posts
            .Where(p => p.Status == PostStatus.Published)
            .Where(p => !p.PostTags.Any(pt => pt.TagId == tagId))
            .Include(p => p.Author)
            .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
            .OrderByDescending(p => p.PostTags.Count(pt => siblingTagIds.Contains(pt.TagId)))
            .ThenByDescending(p => p.PublishedAt ?? p.UpdatedAt)
            .Take(3)
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
}
