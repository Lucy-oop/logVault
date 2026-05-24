using System.Security.Claims;
using Blogfox.Api.Data;
using Blogfox.Api.Dtos.Posts;
using Blogfox.Api.Entities;
using Blogfox.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blogfox.Api.Controllers;

[ApiController]
[Route("api/posts")]
public class PostsController : ControllerBase
{
    private const string ViewerCookie = "bfvk";
    private readonly AppDbContext _db;

    public PostsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<PagedResult<PostListItem>>> List(
        [FromQuery] string? status,
        [FromQuery] string? tag,
        [FromQuery] string? search,
        [FromQuery] string? sort,
        [FromQuery] bool mine = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        IQueryable<Post> q = _db.Posts
            .Include(p => p.Author)
            .Include(p => p.PostTags).ThenInclude(pt => pt.Tag);

        var currentUserId = CurrentUserId();

        if (mine)
        {
            if (currentUserId is null) return Unauthorized();
            q = q.Where(p => p.AuthorId == currentUserId);
        }
        else
        {
            q = q.Where(p => p.Status == PostStatus.Published);
        }

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<PostStatus>(status, true, out var s))
        {
            q = q.Where(p => p.Status == s);
        }

        if (!string.IsNullOrWhiteSpace(tag))
        {
            var tagSlug = tag.Trim().ToLowerInvariant();
            q = q.Where(p => p.PostTags.Any(pt => pt.Tag.Slug == tagSlug));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = $"%{search.Trim()}%";
            q = q.Where(p =>
                EF.Functions.ILike(p.Title, term) ||
                EF.Functions.ILike(p.Excerpt, term) ||
                EF.Functions.ILike(p.ContentMarkdown, term));
        }

        var total = await q.CountAsync();

        var ordered = sort?.ToLowerInvariant() switch
        {
            "popular" or "trending" => q.OrderByDescending(p => p.ViewCount)
                          .ThenByDescending(p => p.PublishedAt ?? p.UpdatedAt),
            "loved" => q.OrderByDescending(p => _db.PostReactions.Count(r => r.PostId == p.Id))
                        .ThenByDescending(p => p.PublishedAt ?? p.UpdatedAt),
            _ => q.OrderByDescending(p => p.PublishedAt ?? p.UpdatedAt),
        };

        var items = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
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

        return Ok(new PagedResult<PostListItem>(items, page, pageSize, total));
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<PostDetail>> GetBySlug(string slug)
    {
        var post = await _db.Posts
            .Include(p => p.Author)
            .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
            .FirstOrDefaultAsync(p => p.Slug == slug);

        if (post is null) return NotFound();

        var isAuthed = User.Identity?.IsAuthenticated ?? false;
        var isOwnerOrAdmin = isAuthed && (
            User.IsInRole(UserRole.Admin.ToString()) ||
            CurrentUserId() == post.AuthorId);

        if (post.Status != PostStatus.Published && !isOwnerOrAdmin) return NotFound();

        if (!isOwnerOrAdmin)
        {
            await TryCountUniqueViewAsync(post);
        }

        return Ok(ToDetail(post));
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<PostDetail>> Create([FromBody] CreatePostRequest req)
    {
        var authorId = CurrentUserId();
        if (authorId is null) return Unauthorized();

        var banned = await _db.Users.Where(u => u.Id == authorId).Select(u => u.IsBanned).FirstOrDefaultAsync();
        if (banned) return StatusCode(403, new { message = "This account is suspended." });

        var slug = await ResolveSlugAsync(req.Slug, req.Title, currentId: null);
        var isDraft = req.Status == PostStatus.Pending;

        var post = new Post
        {
            Slug = slug,
            Title = req.Title.Trim(),
            Excerpt = (req.Excerpt ?? string.Empty).Trim(),
            ContentMarkdown = req.ContentMarkdown,
            CoverImageUrl = req.CoverImageUrl,
            Status = isDraft ? PostStatus.Pending : PostStatus.Published,
            PublishedAt = isDraft ? null : DateTime.UtcNow,
            AuthorId = authorId.Value,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            WordCount = CountWords(req.ContentMarkdown),
        };

        await AttachTagsAsync(post, req.Tags);

        _db.Posts.Add(post);
        await _db.SaveChangesAsync();

        var saved = await _db.Posts
            .Include(p => p.Author)
            .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
            .FirstAsync(p => p.Id == post.Id);

        return CreatedAtAction(nameof(GetBySlug), new { slug = saved.Slug }, ToDetail(saved));
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<PostDetail>> Update(Guid id, [FromBody] UpdatePostRequest req)
    {
        var post = await _db.Posts
            .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (post is null) return NotFound();

        if (!CanModify(post)) return Forbid();

        post.Title = req.Title.Trim();
        post.Slug = await ResolveSlugAsync(req.Slug, req.Title, currentId: post.Id);
        post.Excerpt = (req.Excerpt ?? string.Empty).Trim();
        post.ContentMarkdown = req.ContentMarkdown;
        post.CoverImageUrl = req.CoverImageUrl;
        post.UpdatedAt = DateTime.UtcNow;
        post.WordCount = CountWords(req.ContentMarkdown);

        // Allow publishing a draft. Once published, can't unpublish via this endpoint.
        if (req.Status == PostStatus.Published && post.Status == PostStatus.Pending)
        {
            post.Status = PostStatus.Published;
            post.PublishedAt = DateTime.UtcNow;
        }

        _db.PostTags.RemoveRange(post.PostTags);
        await AttachTagsAsync(post, req.Tags);

        await _db.SaveChangesAsync();

        var saved = await _db.Posts
            .Include(p => p.Author)
            .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
            .FirstAsync(p => p.Id == post.Id);

        return Ok(ToDetail(saved));
    }

    [HttpGet("{slug}/related")]
    public async Task<ActionResult<IReadOnlyList<PostListItem>>> Related(string slug)
    {
        var post = await _db.Posts
            .Where(p => p.Slug == slug && p.Status == PostStatus.Published)
            .Select(p => new { p.Id, Tags = p.PostTags.Select(pt => pt.TagId).ToList() })
            .FirstOrDefaultAsync();
        if (post is null) return NotFound();

        var tagIds = post.Tags;
        IQueryable<Post> q;
        if (tagIds.Count > 0)
        {
            q = _db.Posts
                .Where(p => p.Status == PostStatus.Published && p.Id != post.Id)
                .Where(p => p.PostTags.Any(pt => tagIds.Contains(pt.TagId)));
        }
        else
        {
            q = _db.Posts
                .Where(p => p.Status == PostStatus.Published && p.Id != post.Id);
        }

        var items = await q
            .Include(p => p.Author)
            .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
            .OrderByDescending(p => p.PostTags.Count(pt => tagIds.Contains(pt.TagId)))
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

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        var post = await _db.Posts.FindAsync(id);
        if (post is null) return NotFound();
        if (!CanModify(post)) return Forbid();

        _db.Posts.Remove(post);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task TryCountUniqueViewAsync(Post post)
    {
        var key = Request.Cookies[ViewerCookie];
        if (string.IsNullOrWhiteSpace(key))
        {
            key = Guid.NewGuid().ToString("N");
            Response.Cookies.Append(ViewerCookie, key, new CookieOptions
            {
                HttpOnly = false,
                SameSite = SameSiteMode.Lax,
                Secure = Request.IsHttps,
                Expires = DateTimeOffset.UtcNow.AddYears(1),
                Path = "/"
            });
        }

        var alreadyViewed = await _db.PostViews
            .AnyAsync(v => v.PostId == post.Id && v.ViewerKey == key);
        if (alreadyViewed) return;

        try
        {
            _db.PostViews.Add(new PostView
            {
                PostId = post.Id,
                ViewerKey = key,
                ViewedAt = DateTime.UtcNow,
            });
            post.ViewCount += 1;
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Race: another concurrent view inserted the same row. Ignore.
        }
    }

    private bool CanModify(Post post)
    {
        return CurrentUserId() == post.AuthorId;
    }

    private Guid? CurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    private async Task<string> ResolveSlugAsync(string? requested, string title, Guid? currentId)
    {
        var baseSlug = SlugGenerator.Slugify(
            !string.IsNullOrWhiteSpace(requested) ? requested : title);
        if (string.IsNullOrEmpty(baseSlug)) baseSlug = "post";

        var slug = baseSlug;
        var i = 2;
        while (await _db.Posts.AnyAsync(p => p.Slug == slug && p.Id != currentId))
        {
            slug = $"{baseSlug}-{i++}";
        }
        return slug;
    }

    private async Task AttachTagsAsync(Post post, IReadOnlyList<string>? tagNames)
    {
        if (tagNames is null || tagNames.Count == 0) return;

        var distinct = tagNames
            .Select(t => t.Trim())
            .Where(t => t.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        foreach (var name in distinct)
        {
            var slug = SlugGenerator.Slugify(name);
            var tag = await _db.Tags.FirstOrDefaultAsync(t => t.Slug == slug);
            if (tag is null)
            {
                tag = new Tag { Slug = slug, Name = name };
                _db.Tags.Add(tag);
            }
            post.PostTags.Add(new PostTag { Post = post, Tag = tag });
        }
    }

    private static PostDetail ToDetail(Post p) => new(
        p.Id, p.Slug, p.Title, p.Excerpt, p.ContentMarkdown, p.CoverImageUrl,
        p.Status.ToString(), p.PublishedAt, p.CreatedAt, p.UpdatedAt,
        p.AuthorId, p.Author.DisplayName,
        p.ViewCount,
        p.PostTags.Select(pt => pt.Tag.Name).ToList()
    );

    private static int CountWords(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return 0;
        return text.Split(
            new[] { ' ', '\t', '\n', '\r' },
            StringSplitOptions.RemoveEmptyEntries
        ).Length;
    }
}
