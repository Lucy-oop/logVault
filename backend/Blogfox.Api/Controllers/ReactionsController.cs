using System.Security.Claims;
using Blogfox.Api.Data;
using Blogfox.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blogfox.Api.Controllers;

public record ReactionsResponse(
    int Like,
    int Heart,
    int Haha,
    int Sad,
    int Total,
    string? Mine
);

public record SetReactionRequest(string Kind);

[ApiController]
public class ReactionsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReactionsController(AppDbContext db) => _db = db;

    [HttpGet("api/posts/{slug}/reactions")]
    public async Task<ActionResult<ReactionsResponse>> Get(string slug)
    {
        var post = await _db.Posts
            .Where(p => p.Slug == slug && p.Status == PostStatus.Published)
            .Select(p => new { p.Id })
            .FirstOrDefaultAsync();
        if (post is null) return NotFound();

        var key = CurrentUserId()?.ToString();
        return Ok(await BuildResponseAsync(post.Id, key));
    }

    [HttpPut("api/posts/{slug}/reactions")]
    [Authorize]
    public async Task<ActionResult<ReactionsResponse>> Set(string slug, [FromBody] SetReactionRequest req)
    {
        if (!Enum.TryParse<ReactionKind>(req.Kind, ignoreCase: true, out var kind))
            return BadRequest(new { message = "Invalid reaction kind." });

        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();
        var key = userId.Value.ToString();

        var post = await _db.Posts
            .Where(p => p.Slug == slug && p.Status == PostStatus.Published)
            .Select(p => new { p.Id })
            .FirstOrDefaultAsync();
        if (post is null) return NotFound();

        var existing = await _db.PostReactions
            .FirstOrDefaultAsync(r => r.PostId == post.Id && r.ReactorKey == key);
        if (existing is null)
        {
            _db.PostReactions.Add(new PostReaction
            {
                PostId = post.Id,
                ReactorKey = key,
                Kind = kind,
                CreatedAt = DateTime.UtcNow,
            });
        }
        else
        {
            existing.Kind = kind;
        }
        await _db.SaveChangesAsync();

        return Ok(await BuildResponseAsync(post.Id, key));
    }

    [HttpDelete("api/posts/{slug}/reactions")]
    [Authorize]
    public async Task<ActionResult<ReactionsResponse>> Remove(string slug)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();
        var key = userId.Value.ToString();

        var post = await _db.Posts
            .Where(p => p.Slug == slug && p.Status == PostStatus.Published)
            .Select(p => new { p.Id })
            .FirstOrDefaultAsync();
        if (post is null) return NotFound();

        var existing = await _db.PostReactions
            .FirstOrDefaultAsync(r => r.PostId == post.Id && r.ReactorKey == key);
        if (existing is not null)
        {
            _db.PostReactions.Remove(existing);
            await _db.SaveChangesAsync();
        }

        return Ok(await BuildResponseAsync(post.Id, key));
    }

    private Guid? CurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    private async Task<ReactionsResponse> BuildResponseAsync(Guid postId, string? viewerKey)
    {
        var counts = await _db.PostReactions
            .Where(r => r.PostId == postId)
            .GroupBy(r => r.Kind)
            .Select(g => new { Kind = g.Key, Count = g.Count() })
            .ToListAsync();

        int Get(ReactionKind k) => counts.FirstOrDefault(c => c.Kind == k)?.Count ?? 0;
        var like = Get(ReactionKind.Like);
        var heart = Get(ReactionKind.Heart);
        var haha = Get(ReactionKind.Haha);
        var sad = Get(ReactionKind.Sad);

        string? mine = null;
        if (!string.IsNullOrWhiteSpace(viewerKey))
        {
            var mineKind = await _db.PostReactions
                .Where(r => r.PostId == postId && r.ReactorKey == viewerKey)
                .Select(r => (ReactionKind?)r.Kind)
                .FirstOrDefaultAsync();
            mine = mineKind?.ToString();
        }

        return new ReactionsResponse(like, heart, haha, sad, like + heart + haha + sad, mine);
    }
}
